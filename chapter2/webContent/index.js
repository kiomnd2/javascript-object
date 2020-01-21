`use strict`;

window.onload = function() {
    const type = (target, type) => {
        if(typeof type == "string") {
            if(typeof target != type) throw `invalid type ${target} : ${type}`
        }else if(!(target instanceof type)) throw `invalid type ${target} : ${type}`;
        return target;
    };

    // alert(type(12,"number"));

// 두번째 인자인 _는 아무 동작하지 않지만, 앞의 arr변수를 알고있다.
// 만약 타입을 체크하여 다른 타입이면 thorw 로 인자를 죽임
    const test = (arr, _ = type(arr,Array)) => {
        console.log(arr);
        //test([1,2,3]) true
        //test(123) error
    };


    /*
        const test2 = (a,b,c, _0 = type(a,"string"), _1 = type(b,"number"), _2 = type(c, "boolean"))=>{
            console.log(a,b,c);

            //test2("abc",123,true) ;
        };

        const ViewModel = class {
            static #private = Symbol();
            static get(data){
                return new ViewModel(this.#private , data);
            }

            styles= {}; attributes ={} ; properties  ={}; events ={};
            constructor(checker, data){
                if(checker != ViewModel.#private ) throw "use ViewModel get() !";
                Object.entries(data).forEach(([k ,v])=>{
                    switch(k) {
                        case"styles":this.styles = v; break;
                        case"attributes" :this.attributes =v ; break;
                        case"properties": this.properties =v ; break;
                        case"event" :this.events = v ;break;
                        default: this[k] =v;
                    }
                });
                Object.seal(this);
            }
        };


        const BinderItem = class{
            el; viewmodel;
            constructor(el, viewmodel, _0 =type(el,HTMLElement), _1=type(viewmodel,"string")){
                this.el = el;
                this.viewmodel = viewmodel;
                Object.freeze(this);
            }
        };

        const Binder = class {
            #items = new Set;
            add(V, _= type(v, BinderItem)){this.#items.add(v);}
            render(viewmodel, _ = type(viewmodel, ViewModel)){
                this.#items.forEach(item =>{
                    const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
                    Object.entries(vm.styles).forEach(([k,v])=>el.style[k] =v);
                    Object.entries(vm.attributes).forEach(([k,v])=>el.setAttribute(k,v));
                    Object.entries(vm.properties).forEach(([k,v])=>el[k] =v);
                    Object.entries(vm.events).forEach(([k,v])=>el["on" +k]=e =>v.call(el,e,viewmodel ));
                });
            }
        };

        const Scanner = class {
            scan(el, _ = type(el,HTMLElement)) {
                const binder = new Binder;
                this.checkItem(binder,el);
                const stack = [el.firstElementChild];
                let target;
                while(target = stack.pop()) {
                    this.checkItem(binder,target);
                    if(target.firstElementChild) stack.push(target.firstElementChild);
                    if(target.nextElementSibling) stack.push(target.nextElementSibling);

                }
            }
            checkItem(binder, el){
                const vm = el.getAttribute("data-viewmodel");
                if(vm) binder.add(new BinderItem(el,vm));
            }
        };



    // client
        const viewmodel = ViewModel.get({
            wrapper:ViewModel.get({
                styles:{
                    width:"50%",
                    background:"#ffa",
                    cursor:"pointer"
                }
            }),
            title : ViewModel.get({
                properties :{
                    innerHTML: "Title"
                }
            }),
            contents :ViewModel.get({
                properties :{
                    innerHtml : "Contents"
                }
            })

        });


        const scanner = new Scanner;
        const binder = scanner.scan(document.querySelector("#target"));
        binder.render(viewmodel);*/

};
/*

*/
