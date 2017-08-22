'use strict'

import {
    NativeModules,
    DeviceEventEmitter
} from 'react-native';

const googleFit = NativeModules.RNGoogleFit;

class RNGoogleFit {
    constructor() {
    }

    authorize(callback) {
        googleFit.authorize(
          msg => callback(msg, false),
          res => callback(false, res)
        );
    }

    //Will be deprecated in future releases
    getSteps(dayStart,dayEnd) {
        googleFit.getDailySteps(dayStart, dayEnd);
    }

    //Will be deprecated in future releases
    getWeeklySteps(startDate) {
        googleFit.getWeeklySteps(startDate, Date.now());
    }


    /**
     * Get the total steps per day over a specified date range.
     * @param {Object} options getDailyStepCountSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getDailyStepCountSamples(options, callback) {
        let startDate = options.start;
        let endDate = options.end;
        googleFit.getDailyStepCountSamples( startDate,
            endDate,
            (msg) => {
                callback(msg, false);
            },
            (res) => {
                if (res.length>0) {
                    callback(false, res.map(function(dev) {
                        var obj = {};
                        obj.source = dev.source.appPackage + ((dev.source.stream) ? ":" + dev.source.stream : "");
                        obj.steps = this.buildDailySteps(dev.steps);
                        return obj;
                        }, this)
                    );
                } else {
                    callback("There is no any steps data for this period", false);
                }
            });
    }

    buildDailySteps(steps)
    {
        let results = {};
        for(var step of steps) {
            if (step == undefined) continue;

            var date = new Date(step.startDate);

            var day = ("0" + date.getDate()).slice(-2);
            var month = ("0" + (date.getMonth()+1)).slice(-2);
            var year = date.getFullYear();
            var dateFormatted = year + "-" + month + "-" + day;

            if (!(dateFormatted in results)) {
                results[dateFormatted] = 0;
            }

            results[dateFormatted] += step.steps;
        }

        let results2 = [];
        for(var index in results) {
            results2.push({date: index, value: results[index]});
        }
        return results2;
    }

    /**
     * Get the total distance per day over a specified date range.
     * @param {Object} options getDailyDistanceSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getDailyDistanceSamples(options, callback) {
        let startDate = options.start;
        let endDate = options.end;
        googleFit.getDailyDistanceSamples( startDate,
            endDate,
            (msg) => {
                callback(msg, false);
            },
            (res) => {
                if (res.length>0) {
                    res = res.map((el) => {
                        if (el.distance) {
                            el.startDate = new Date(el.startDate).toISOString();
                            el.endDate = new Date(el.endDate).toISOString();
                            return el;
                        }
                    });
                    callback(false, res.filter(day => day != undefined));
                } else {
                    callback("There is no any distance data for this period", false);
                }
            });
    }

    /**
     * Query for weight samples. the options object is used to setup a query to retrieve relevant samples.
     * @param {Object} options  getDailyStepCountSamples accepts an options object containing unit: "pound"/"kg",
     *                          startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getWeightSamples(options, callback) {
        let startDate = Date.parse(options.startDate);
        let endDate = Date.parse(options.endDate);
        googleFit.getWeightSamples( startDate,
            endDate,
            (msg) => {
                callback(msg, false);
            },
            (res) => {
                if (res.length>0) {
                    res = res.map((el) => {
                        if (el.value) {
                            if (options.unit == 'pound') {
                                el.value = this.KgToLbs(el.value); //convert back to pounds
                            }
                            el.startDate = new Date(el.startDate).toISOString();
                            el.endDate = new Date(el.endDate).toISOString();
                            return el;
                        }
                    });
                    callback(false, res.filter(day => day != undefined));
                } else {
                    callback("There is no any weight data for this period", false);
                }
            });
    }

    saveWeight(options, callback) {
        if (options.unit == 'pound') {
            options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); //convert pounds and ounces to kg
        }
        options.date = Date.parse(options.date);
        googleFit.saveWeight( options,
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);

            });
    }

    deleteWeight(options, callback) {
        if (options.unit == 'pound') {
            options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); //convert pounds and ounces to kg
        }
        options.date = Date.parse(options.date);
        googleFit.deleteWeight( options,
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);

            });
    }

    isAvailable(callback) { // true if GoogleFit installed
        googleFit.isAvailable(
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);
            });
    }

    isEnabled(callback) { // true if permission granted
        googleFit.isEnabled(
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);
            });
    }

    observeSteps(callback) {
        DeviceEventEmitter.addListener(
            'StepChangedEvent',
            (steps) => callback(steps)
        );

        googleFit.observeSteps();
    }

    observeHistory(callback) {
        DeviceEventEmitter.addListener(
            'StepHistoryChangedEvent',
            (steps) => callback(steps)
        );
    }

    onAuthorize(callback) {
        DeviceEventEmitter.addListener(
            'AuthorizeEvent',
            (authorized) => callback(authorized)
        );
    }

    usubscribeListeners() {
        DeviceEventEmitter.removeAllListeners();
    }

    lbsAndOzToK(imperial) {
        let pounds = imperial.pounds + imperial.ounces / 16;
        return pounds * 0.45359237;
    }

    KgToLbs(metric) {
        return metric * 2.2046;
    }

}

export default new RNGoogleFit();
