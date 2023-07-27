var config = {
    baseBet: {
        label: "base bet",
        value: 100,
        type: "number"
    },
    payoutminimum: {
        label: "payout minimum",
        value: 3,
        type: "number"
    },
    payoutmaksimum: {
        label: "payout maksimum",
        value: 6,
        type: "number"
    },
    stop: {
        label: "stop if next bet >",
        value: 1e8,
        type: "number"
    },
    onLoseTitle: {
        label: "On Lose",
        type: "title"
    },
    onLoss: {
        label: "",
        value: "reset",
        type: "radio",
        options: [
            {
                value: "reset",
                label: "Return to base bet"
            },
            {
                value: "increase",
                label: "Increase bet by (loss multiplier)"
            },
        ],
    },
    lossMultiplier: {
        label: "loss multiplier",
        value: 1.3,
        type: "number"
    },
    onWinTitle: {
        label: "On Win",
        type: "title"
    },
    onWin: {
        label: "",
        value: "reset",
        type: "radio",
        options: [
            {
                value: "reset",
                label: "Return to base bet"
            },
            {
                value: "increase",
                label: "Increase bet by (win multiplier)"
            },
        ],
    },
    winMultiplier: {
        label: "win multiplier",
        value: 2,
        type: "number"
    },
    berhentikemenangan: {
        label: "Reset if Profit : OKI.",
        value: 0.1,
        type: "number"
    },
    JumlahBeruntun: {
        label: "Lose Condition",
        type: "title"
    },
    kondisi: {
        label: "Jumlah Beruntun",
        type: "number",
        value: 5
    },
    minimumpayout: {
        label: "Minimum Payout",
        type: "number",
        value: 1.2
    },
    maksimumpayout: {
        label: "Maksimum Payout",
        type: "number",
        value: 3
    },
    resetbalance: {
        label: "Reset if Balance : OKI",
        type: "number",
        value: 1000
    },
    loseStreak: {
        label: "Jika Lose Streak",
        type: "number",
        value: 3
    },
    incrWinAmoLT: {
        label: "Incr Win Amo LT",
        type: "number",
        value: 200
    },
    jikaLoseValue: {
        label: "Jika Lose Value",
        type: "number",
        value: 1000
    },
    recoveryMode: {
        label: "Recovery Mode",
        type: "title"
    },
    penempatanJatuh: {
        label: "Penempatan Jatuh PAYOUT",
        type: "number",
        value: 1.4
    },
    multiplierJatuh: {
        label: "Multiplier Untuk Jatuh PAYOUT",
        type: "number",
        value: 3
    },
    levelLoseMode: {
        label: "Level Lose x Mode Aktif",
        type: "number",
        value: 110
    },
    resetIfWinStreak: { // Tambahkan form baru di sini
        label: "Reset jika WIN STREAK",
        value: 1,
        type: "number"
    }
};

function main() {
    var currentBet = config.baseBet.value;
    var awal = currentBet;
    var batas = config.berhentikemenangan.value;
    var kondisi = config.kondisi.value;
    var minimumPayout = config.minimumpayout.value;
    var count = 0;
    var batasMaksimum = currency.amount + config.resetbalance.value;
    var loseStreak = 0;
    var totalProfit = 0;
    var recoveryMode = false;
    var recoveryModePayout = config.penempatanJatuh.value;
    var recoveryModeMultiplier = config.multiplierJatuh.value;
    var recoveryModeLevel = config.levelLoseMode.value;
    var totalLoss = 0; // Total kekalahan user sebelum masuk recovery mode
    var recoveryRound = 0; // Jumlah ronde yang telah berlalu dalam recovery mode
    var winStreak = 0; // Jumlah kemenangan berturut-turut saat ini

    game.onBet = function () {
        if (loseStreak == recoveryModeLevel && !recoveryMode) {
            recoveryMode = true;
            recoveryModePayout = config.penempatanJatuh.value;
            recoveryModeMultiplier = config.multiplierJatuh.value;
            totalLoss = currency.lose; // Mengumpulkan total kekalahan sebelum masuk recovery mode
            recoveryRound = 1; // Set jumlah ronde dalam recovery mode menjadi 1
            log.success("Entering Recovery Mode");
        }

        if (recoveryMode && recoveryRound > 0) {
            if (recoveryRound == 2) {
                recoveryMode = false;
                currentBet = awal; // Reset currentBet ke base bet setelah recovery mode selesai
                log.success("Exiting Recovery Mode");
            } else {
                recoveryRound++;
                return;
            }
        }

        if (recoveryMode) {
            if (recoveryRound == 1) {
                // Kalkulasi total kekalahan untuk di-recover
                totalLoss = currency.lose * recoveryModeMultiplier;
                game.bet(totalLoss, recoveryModePayout).then(function (payout) {
                    if (payout >= minimumPayout) {
                        var profit = payout * totalLoss - totalLoss;
                        currency.amount += profit; // Tambahkan profit ke balance
                        currentBet = awal; // Reset currentBet ke base bet setelah menang di recovery mode
                        log.success(
                            "We won in Recovery Mode, so next bet will be " +
                            currentBet +
                            " " +
                            currency.currencyName
                        );
                        count = 0;
                        totalProfit += profit;
                        recoveryRound++;
                    } else {
                        currency.amount -= totalLoss;
                        currentBet *= config.lossMultiplier.value;
                        log.error(
                            "We lost in Recovery Mode, so next bet will be " +
                            currentBet +
                            " " +
                            currency.currencyName
                        );
                        count++;
                        loseStreak++;
                        if (config.jikaLoseValue.value > 0 && Math.abs(currentBet - awal) >= config.jikaLoseValue.value) {
                            currentBet = awal;
                            log.success("Resetting bet to base bet due to lose value condition");
                        }
                    }
                    if (currentBet > config.stop.value) {
                        log.error(
                            "Was about to bet " + currentBet + " which triggers the stop"
                        );
                        game.stop();
                    }
                    if (currency.amount >= batasMaksimum) {
                        batasMaksimum += config.resetbalance.value;
                        currentBet = awal;
                    }
                    log.success(currency.amount);
                }).catch(function (err) {
                    log.error("Error occurred during Recovery Mode: " + err);
                });
            } else if (recoveryRound == 2) {
                // Cari win setelah kalah di recovery mode
                game.bet(currentBet, minimumPayout).then(function (payout) {
                    if (payout >= minimumPayout) {
                        var profit = payout * currentBet - currentBet;
                        currency.amount += profit; // Tambahkan profit ke balance
                        currentBet = awal; // Reset currentBet ke base bet setelah menang di recovery mode
                        log.success(
                            "We won in Recovery Mode, so next bet will be " +
                            currentBet +
                            " " +
                            currency.currencyName
                        );
                        count = 0;
                        totalProfit += profit;
                        winStreak++; // Tambahkan 1 ke winStreak saat menang

                        if (winStreak >= config.resetIfWinStreak.value) {
                            currentBet = awal;
                            log.success("Resetting bet to base bet due to win streak condition");
                            winStreak = 0; // Reset winStreak saat mencapai batas
                        }
                        loseStreak = 0; // Reset loseStreak saat menang
                        recoveryRound++;
                    } else {
                        // Lanjutkan ke ronde selanjutnya jika kalah lagi
                        currency.amount -= currentBet;
                        currentBet *= config.lossMultiplier.value;
                        log.error(
                            "We lost, so next bet will be " +
                            currentBet +
                            " " +
                            currency.currencyName
                        );
                        count++;
                        loseStreak++;
                        if (config.jikaLoseValue.value > 0 && Math.abs(currentBet - awal) >= config.jikaLoseValue.value) {
                            currentBet = awal;
                            log.success("Resetting bet to base bet due to lose value condition");
                        }
                        winStreak = 0; // Reset winStreak saat kalah

                        if (loseStreak >= config.loseStreak.value) {
                            currentBet = awal;
                            log.success("Resetting bet to base bet due to lose streak condition");
                            loseStreak = 0; // Reset loseStreak saat mencapai batas
                        }
                    }
                    if (currentBet > config.stop.value) {
                        log.error(
                            "Was about to bet " + currentBet + " which triggers the stop"
                        );
                        game.stop();
                    }
                    if (currency.amount >= batasMaksimum) {
                        batasMaksimum += config.resetbalance.value;
                        currentBet = awal;
                    }
                    log.success(currency.amount);
                });
            }
        } else {
            // Mode Normal
            game.bet(currentBet, (Math.random() * (config.payoutmaksimum.value - config.payoutminimum.value)) + config.payoutminimum.value).then(function (payout) {
                if (payout >= minimumPayout) {
                    var profit = payout * currentBet - currentBet;
                    currency.amount += profit; // Tambahkan profit ke balance
                    if (config.onWin.value === "reset") {
                        currentBet = config.baseBet.value;
                    } else {
                        currentBet *= config.winMultiplier.value;
                    }
                    log.success(
                        "We won, so next bet will be " +
                        currentBet +
                        " " +
                        currency.currencyName
                    );
                    count = 0;
                    totalProfit += profit;
                    winStreak++; // Tambahkan 1 ke winStreak saat menang

                    if (winStreak >= config.resetIfWinStreak.value) {
                        currentBet = awal;
                        log.success("Resetting bet to base bet due to win streak condition");
                        winStreak = 0; // Reset winStreak saat mencapai batas
                    }
                    loseStreak = 0; // Reset loseStreak saat menang
                } else {
                    // Kekalahan di mode normal
                    currency.amount -= currentBet;
                    if (config.onLoss.value === "reset") {
                        currentBet = config.baseBet.value;
                    } else {
                        currentBet *= config.lossMultiplier.value;
                    }
                    log.error(
                        "We lost, so next bet will be " +
                        currentBet +
                        " " +
                        currency.currencyName
                    );
                    count++;
                    loseStreak++;
                    if (config.jikaLoseValue.value > 0 && Math.abs(currentBet - awal) >= config.jikaLoseValue.value) {
                        currentBet = awal;
                        log.success("Resetting bet to base bet due to lose value condition");
                    }
                    winStreak = 0; // Reset winStreak saat kalah

                    if (loseStreak >= config.loseStreak.value) {
                        currentBet = awal;
                        log.success("Resetting bet to base bet due to lose streak condition");
                        loseStreak = 0; // Reset loseStreak saat mencapai batas
                    }
                }
                if (currentBet > config.stop.value) {
                    log.error(
                        "Was about to bet " + currentBet + " which triggers the stop"
                    );
                    game.stop();
                }
                if (currency.amount >= batasMaksimum) {
                    batasMaksimum += config.resetbalance.value;
                    currentBet = awal;
                }
                log.success(currency.amount);
            });
        }
    };
}

