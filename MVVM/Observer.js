class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        //先把旧值保存起来
        this.oldVal = this.getOldVal();
    }
    getOldVal() {
        Dep.target = this;
        const oldVal = compileUtil.getVal(this.expr, this.vm);
        Dep.target = null;
        return oldVal;
    }
    update() {
        const newVal = compileUtil.getVal(this.expr, this.vm);
        if (newVal !== this.oldVal) {
            this.cb(newVal);
        }
    }
}
class Dep {//依赖收集器
    constructor() {
        this.subs = [];
    }
    //收集观察者
    addSub(watcher) {
        this.subs.push(watcher);
    }
    //通知观察者去更新
    notify() {
        console.log('通知了观察者', this.subs);
        this.subs.forEach(item => item.update())
    }
}
class Observer {
    constructor(data) {
        this.observer(data);
    }
    observer(data) {
        //data为数据
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            })
        }
    }
    defineReactive(obj, key, value) {
        //递归遍历
        this.observer(value);
        const dep = new Dep();
        //劫持并监听
        Object.defineProperty(obj, key, {
            enumerable: true,//可枚举性，表示能否通过for-in遍历得到属性。默认值为true。
            configurable: false,//可配置性，控制着其描述的属性的修改，表示能否修改属性的特性，能否把属性修改为访问器属性，或者能否通过delete删除属性从而重新定义属性。默认值为true。
            get() {
                //订阅者数据变化时，往Dep中添加观察者
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newValue) => {
                this.observer(newValue);
                if (newValue !== value) {
                    value = newValue;
                }
                //告诉Dep通知变化
                dep.notify();
            }
        })
    }
}