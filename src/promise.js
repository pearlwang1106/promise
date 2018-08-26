function Promise (executor) {
    let self = this;
    self.status = 'PENDING';
    self.value = undefined;
    self.reason = undefined;
    self.onResolved = [];
    self.onRejected = [];

    function resolve(value) {
        setTimeout(() => {
            if (self.status === 'PENDING') {
                self.status = 'RESOLVED';
                self.value = value;
                self.onResolved.forEach(fn => fn());
            }
        }, 0);
    }

    function reject(reason) {
        setTimeout(() => {
            if(self.status === 'PENDING') {
                self.status = 'REJECTED';
                self.reason = reason;
                self.onRejected.forEach(fn => fn());
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

let resolutionProcedure = (promise2, x, resolve, reject) => {
    // 2.3.1 
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }

    let called = false;
    // 2.3.3
    if (x != null && (typeof x === 'object' || typeof x === 'function')) {
        try {
            // 2.3.3.1
            let then = x.then;
            // 如果 then 是一个 function，则认为 x 是一个 promise
            if (typeof then === 'function') {
                // 2.3.3.3
                then.call(x, y => {
                    // 2.3.3.3.3
                    if (called) return;
                    called = true;
                    // 2.3.3.3.1
                    resolutionProcedure(promise2, y, resolve, reject);
                }, r => {
                    // 2.3.3.3.3
                    if (called) return;
                    called = true;
                    reject(r);
                });
            }
            else {
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
    }
    else {
        // 规范 2.3.4，x 为基本类型
        resolve(x);
    }
};

// 2.2 
Promise.prototype.then = function (onResolved, onRejected) {
    // 2.2.1
    onResolved = typeof onResolved == 'function' ? onResolved : val => val;
    onRejected = typeof onRejected == 'function' ? onRejected : err => {
        throw err;
    };

    let self = this;

    // 规范 2.2.7，then 必须返回一个新的 promise
    let promise2;
    promise2 = new Promise((resolve, reject) => {
        if (self.status === 'RESOLVED') {
            // 2.2.1.5 异步返回
            setTimeout(() => {
                try {
                    let x = onResolved(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }

        if (self.status === 'REJECTED') {
            setTimeout(() => {
                try {
                    let x = onRejected(self.reason);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }

        if (self.status === 'PENDING') {
            self.onResolved.push(() => {
                setTimeout(() => {
                    try {
                        let x = onResolved(self.value);
                        resolutionProcedure(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            });

            self.onRejected.push(() => {
                setTimeout(() => {
                    try {
                        let x = onRejected(self.reason);
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

Promise.all = (promises) => {
    return new Promise((resolve, reject) => {
        let sum = 0;
        let results = [];
        let processFn = (index, value) => {
            results[index] = value;
            sum++;
            if (sum === promises.length) {
                resolve(results);
            }
        };
        for(let index = 0; index < promises.length; index++) {
            let p = promises[index];
            p.then((value) => {
                processFn(index, value);
            }, reject);
        }
    });
};

Promise.race = (promises) => {
    return new Promise((resolve, reject) => {
        for(let index = 0; index < promises.length; index++) {
            let p = promises[index];
            p.then((value) => {
                resolve(value);
            }, reject);
        }
    });
};

Promise.resolve = (value) => {
    // resolve 的时候 reject 暂未用到，所以 去掉了，单测可以通过
    return new Promise((resolve) => {
        resolve(value);
    });
};

Promise.reject = (reason) => {
    return new Promise((resolve, reject) => {
        reject(reason);
    });
};

Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};

module.exports = Promise;





