//数据源
let obj = {
    name: 'dy',
    age: {
        age: 20
    }
}

//vue 数据劫持 Object.defineProperty
function observer(obj) {
    if (typeof obj == 'object') {

        for (let key in obj) {
            defineReactive(obj, key, obj[key]);
        }
    }
}
function defineReactive(obj, key, value) {
    observer(value);    //json内套json
    Object.defineProperty(obj, key, {
        get() {
            return value
        },
        set(val) {
            console.log('数据更新了');
            value = val;
        }
    })
}
observer(obj);

obj.age = [1, 2, 3, 4];
//vue 把 数组上所有方法 都重写了

let arr = ['push', 'pop', 'slice', 'shift', 'unshift'];
arr.forEach(method => {
    let oldPush = Array.prototype[method];
    Array.prototype[method] = function (value) {
        console.log('数据更新')
        oldPush.call(this, value)
    }
})

obj.age.push(6);

//如果属性不存在，默认后增加的内容 并不会刷新视图
//数组调用push是无效的 Object.defineProperty不支持数组
// obj.age.length--;    数组不能通过长度修改，也不能通过数组的索引进行修改
console.log(obj.age);
