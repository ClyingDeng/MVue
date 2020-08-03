const compileUtil = {
    getVal(expr, vm) {//person.name msg
        // console.log(typeof(expr));
        return expr.split('.').reduce((data, currentVal) => {
            // console.log(currentVal);
            return data[currentVal];
        }, vm.$data);
    },
    setVal(expr, vm, inputVal) {//'person.name' vm.$data 
        expr.split('.').reduce((data, currentVal, index, arr) => {
            if (index == arr.length - 1) {
                return data[currentVal] = inputVal;
            }
            return data[currentVal]
        }, vm.$data);
    },
    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm)
        })
    },
    text(node, expr, vm) {//expr:msg 
        let value;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                //绑定观察者，数据发生变化触发这里回调，进行更新
                new Watcher(vm, args[1], () => {
                    this.updater.textUpdater(node, this.getContentVal(expr, vm));
                })
                return this.getVal(args[1], vm)
            })
        } else {
            value = this.getVal(expr, vm);
        }
        this.updater.textUpdater(node, value);
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm);
        new Watcher(vm, expr, (newVal) => {
            this.updater.htmlUpdater(node, newVal);
        })
        this.updater.htmlUpdater(node, value);
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm);
        //绑定更新函数，数据驱动视图
        new Watcher(vm, expr, (newVal) => {
            this.updater.modelUpdater(node, newVal);
        })
        //视图=>数据=>视图
        node.addEventListener('input', (e) => {
            //设置值 e.target.value用户输入的内容
            this.setVal(expr, vm, e.target.value);
        })
        this.updater.modelUpdater(node, value);
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr];
        node.addEventListener(eventName, fn.bind(vm), false);
    },
    bind(node, expr, vm, arttrName) {

    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value;
        },
        htmlUpdater(node, value) {  //xss攻击
            node.innerHTML = value;
        },
        modelUpdater(node, value) {
            node.value = value;
        }
    }

}

class Compile {
    constructor(el, vm) {
        // console.log(el);
        //判断el属性 是不是一个元素 如果不是元素 那就获取他
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        // 1.获取文档碎片对象，放入内存中会减少页面的重绘和重排
        const fragment = this.node2Fragment(this.el);
        // console.log(fragment);
        //2.编译模板
        this.compile(fragment);

        //3.追加子元素到根元素
        this.el.appendChild(fragment);

    }
    compile(fragment) {
        //1.获取子节点
        const childNodes = fragment.childNodes;
        //2.遍历
        [...childNodes].forEach(child => {
            if (this.isElementNode(child)) {
                //是元素节点
                //编译元素节点
                // console.log('元素节点', child);
                this.compileElement(child);
            } else {
                //文本节点
                //编译文本节点
                // console.log('文本节点', child);
                this.compileText(child);
            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child);
            }
        })
    }
    compileElement(node) {
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            const { name, value } = attr;
            // console.log(name);
            if (this.isDirective(name)) {//是一个指令 v-text v-html v-model v-on:click
                const [, directive] = name.split('-');
                const [dirName, eventName] = directive.split(":");//text html model on
                //更新数据 数据驱动视图
                compileUtil[dirName](node, value, this.vm, eventName);

                //删除有指令的标签上的属性
                node.removeAttribute('v-' + directive);
            } else if (this.isEventName(name)) {
                let [, eventName] = name.split('@');
                compileUtil['on'](node, value, this.vm, eventName);
            }
        })
    }
    compileText(node) {
        const content = node.textContent;
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil['text'](node, content, this.vm);
        }
    }
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    isEventName(attrName) {
        return attrName.startsWith('@');
    }
    node2Fragment(el) {
        //创建文档碎片
        const f = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild);
        }
        return f;
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
}
class MVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        this.$options = options;
        let computed = options.computed;
        if (this.$el) {
            //1.实现数据观察者
            new Observer(this.$data);

            //计算属性
            // console.log(computed);
            for (let key in computed) { //有依赖关系
                Object.defineProperty(this.$data, key, {
                    get: () => {
                        return computed[key].call(this);
                    }
                })
            }
            this.proxyData(this.$data);
            //2.实现指令解析器
            new Compile(this.$el, this);
        }
    }
    proxyData(data) {
        for (const key in data) {
            Object.defineProperty(this, key, {  //实现可以通过vm取到对应的内容
                get() {
                    return data[key];
                },
                set(newVal) {
                    data[key] = newVal;
                }
            })
        }
    }
}