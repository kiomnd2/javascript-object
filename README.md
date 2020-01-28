## chapter2

### MVVM 패턴


## typeChecker

```javascript
const type = (target, type) => {
    if(typeof type == "string") {
        if(typeof target != type) throw `invalid type ${target} : ${type}`
    }else if(!(target instanceof type)) throw `invalid type ${target} : ${type}`
    return target;
};
```
> 타입을 체크하는 함수. 

<br>

``` javascript
const test = (arr, _ = type(arr,Array)) => {
    console.log(arr);

    //test([1,2,3]) true
    //test(123) error
};
```
> * 두번째 인자인 _는 아무 동작하지 않지만, 앞의변수를 알고있다.
> * 따라서 두번째 인자를 통해 인자에 대한 타입을 체크하는 로직을 작성 할 수 있다.
> * 만약 타입을 체크하여 arr 타입이 아니면 throw 

```
const test2 = (a,b,c, _0 = type(a,"string"), _1 = type(b,"number"), _2 = type(c, "boolean"))=>{
    console.log(a,b,c);

    //test2("abc",123,true) ;
};
```
> * 위와 같이 파라미터가 복수개일 때도 체크가 가능


### view hook & bind

```html
<section id="target" data-viewmodel="wrapper">
    <h2 data-viewmodel="title"></h2>    
    <section data-viewmodel="contents"></section>
</section>
```
> * hook과 매칭되는 속성 wrapper, title, contents 
> * binder가 view를 쭉 읽고 특정 view모델과 연결하여 view를 처리
> * view를 스캔하는 역할이 binder 
> * view를 스캔하는 방식은 모델과 view를 나눠서 관리하기 쉬움
> * binder는 viewmodel을 알고있고 스캐너를 통해 view정보를 가져옴

viewmodel -> binder <- scanner -> html


``` javascript
const ViewModel = class {
    static #private = Symbol(); // symbol은 외부에 노출 될 수 없다
    static get(data){
        return new ViewModel(this.#private , data);
    }

    styles= {}; attributes ={} ; properties  ={}; events ={}; // viewmodel의 속성
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
        Object.seal(this); // 더이상 키의 추가를 막음
    }
};
```
* 프라이빗 속성은 #으로 시작함
* static의 this는 class를 위미
* 외부에서는 Viewmodel을 호출 할때 절 때 첫번째 인자로 private 속성을 넘길 수 없다.


```
const BinderItem = class{
    el; viewmodel;
    constructor(el, viewmodel, _0 =type(el,HTMLElement), _1=type(viewmodel,"string")){ 
        this.el = el;
        this.viewmodel = viewmodel;
        Object.freeze(this); // 변화를 막음
    }
};
const Binder = class {
    #items = new Set;
    add(v, _= type(v, BinderItem)){this.#items.add(v);}
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

```



```
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
        return binder;
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
binder.render(viewmodel);

```