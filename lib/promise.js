'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function Promise(executor) {
    var self = this;
    self.status = 'PENDING';
    self.value = undefined;
    self.reason = undefined;
    self.onResolved = [];
    self.onRejected = [];

    function resolve(value) {
        setTimeout(function () {
            if (self.status === 'PENDING') {
                self.status = 'RESOLVED';
                self.value = value;
                self.onResolved.forEach(function (fn) {
                    return fn();
                });
            }
        }, 0);
    }

    function reject(reason) {
        setTimeout(function () {
            if (self.status === 'PENDING') {
                self.status = 'REJECTED';
                self.reason = reason;
                self.onRejected.forEach(function (fn) {
                    return fn();
                });
            }
        }, 0);
    }

    // 用于解决以下问题
    // new Promise(() => throw Error('error))
    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

var resolutionProcedure = function resolutionProcedure(promise2, x, resolve, reject) {
    // 2.3.1 
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }

    var called = false;
    // 2.3.3
    if (x != null && ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' || typeof x === 'function')) {
        try {
            // 2.3.3.1
            var then = x.then;
            if (typeof then === 'function') {
                // 2.3.3.3
                then.call(x, function (y) {
                    // 2.3.3.3.3
                    if (called) return;
                    called = true;
                    // 2.3.3.3.1
                    resolutionProcedure(promise2, y, resolve, reject);
                }, function (r) {
                    // 2.3.3.3.3
                    if (called) return;
                    called = true;
                    reject(r);
                });
            } else {
                // 2.3.3.4
                resolve(x);
            }
        } catch (e) {
            // 2.3.3.3.3
            if (called) return;
            called = true;
            // 2.3.3.2
            reject(e);
        }
    } else {
        // 规范 2.3.4，x 为基本类型
        resolve(x);
    }
};

// 2.2 
Promise.prototype.then = function (onResolved, onRejected) {
    // 2.2.1
    onResolved = typeof onResolved == 'function' ? onResolved : function (val) {
        return val;
    };
    onRejected = typeof onRejected == 'function' ? onRejected : function (err) {
        throw err;
    };

    var self = this;

    // 规范 2.2.7，then 必须返回一个新的 promise
    var promise2 = void 0;
    promise2 = new Promise(function (resolve, reject) {
        if (self.status === 'RESOLVED') {
            // 2.2.1.5 异步返回
            setTimeout(function () {
                try {
                    var x = onResolved(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }

        if (self.status === 'REJECTED') {
            setTimeout(function () {
                try {
                    var x = onRejected(self.reason);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }

        if (self.status === 'PENDING') {
            self.onResolved.push(function () {
                setTimeout(function () {
                    try {
                        var x = onResolved(self.value);
                        resolutionProcedure(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            });

            self.onRejected.push(function () {
                setTimeout(function () {
                    try {
                        var x = onRejected(self.reason);
                        resolutionProcedure(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            });
        }
    });
    return promise2;
};

Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
};

Promise.all = function (promises) {
    return new Promise(function (resolve, reject) {
        var sum = 0;
        var results = [];
        var processFn = function processFn(index, value) {
            results[index] = value;
            sum++;
            if (sum === promises.length) {
                resolve(results);
            }
        };

        var _loop = function _loop(index) {
            var p = promises[i];
            p.then(function (value) {
                processFn(index, value);
            }, reject);
        };

        for (var index = 0; index < promises.length; index++) {
            _loop(index);
        }
    });
};

Promise.race = function (promises) {
    return new Promise(function (resolve, reject) {
        for (var index = 0; index < promises.length; index++) {
            var p = promises[index];
            p.then(function (value) {
                resolve(value);
            }, reject);
        }
    });
};

Promise.resolve = function (value) {
    return new Promise(function (resolve, reject) {
        resolve(value);
    });
};

Promise.reject = function (reason) {
    return new Promise(function (resolve, reject) {
        reject(reason);
    });
};

Promise.defer = Promise.deferred = function () {
    var dfd = {};
    dfd.promise = new Promise(function (resolve, reject) {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};

module.exports = Promise;