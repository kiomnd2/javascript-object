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


## chapter3. Observer
> Observer 패턴은 상태에 대한 변경을 관찰하여 상태 변경시 바로 변경하기 위해 사용하는 패턴

### Binder 수정
* 반복 부분이 있음
* 기존 소스 코드에 대한 객체화 필요

```javascript
// 기존코드
const Binder = class{
    #items = new Set(); 
    add(v,_=type(v, BinderItem)) { this.#items.add(v) }
    render(viewmodel, _=type(viewmodel, ViewModel)){
        items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
            Object.entries(vm.styles).forEach(([k,v])=> el.style[k] =v); 
            Object.entries(vm.properties).forEach(([k,v])=> el[k] = v);
            Object.entries(vm.attributes).forEach(([k,v])=> el.setAttribute(k,v));
            Object.entries(vm.events).forEach(([k,v])=>el["on"+k]=e => v.call(el,e,vm));
        });     
    }
}


//수정 후

const Processor = class {
    cat;
    constructor(cat) {
        this.cat = cat; 
    }
    
    process(vm, el, k, v) {
        this._process(vm, el, k, v);
    }
    _process(vm, el, k, v) { throw "override" ;}
    /**
    * new (class extends Process{
    *   _process(vm, el, k, v ){
    *       el.style[k] = v;   
    *   }
    * }("styles));
    * /
*/
};

const Binder = class{
    #items = new Set(); #processors = {};
    add(v,_=type(v, BinderItem)) { this.#items.add(v) }
    addProcessor(v, _=type(v, Processor)) { this.#processors[v.cat] = v } // 카테고리 별 주입
    
    render(viewmodel, _=type(viewmodel, ViewModel)){
        const processors = Object.entries(this.#processors);
        items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
            processors.forEach(([k,v])=>{
                processors.process(vm, el, k, v);         
            });
            /* Object.entries(vm.styles).forEach(([k,v])=> el.style[k] =v); 
            Object.entries(vm.properties).forEach(([k,v])=> el[k] = v);
            Object.entries(vm.attributes).forEach(([k,v])=> el.setAttribute(k,v));
            Object.entries(vm.events).forEach(([k,v])=>el["on"+k]=e => v.call(el,e,vm)); */
        });     
    }
}

```
* 의존성 주입을 위해 Processor 객체 생성
    * Processor 내에 _process를 상속하여 사용
    * client에서 의존성을 주입
* binder 에서 processor 객체를 오브젝트로 추가한 이유는 중복을 방지
* Processor에 처리를 위임


### ViewModel의 subject화

```javascript
//기존코드
const ViewModel = class{
    static #private = Symbol();
    
    static get(data) {
        return new ViewModel(this.#private, data);  
    };
    
    styles ={}; properties = {}; events = {}; attributes = {};
    constructor(checker, data){
        if(checker != this.#private) { throw new Error('use Get() !')};
        Object.entries(data).forEach(([k,v])=>{
            switch (k) {
                case"styles" : this.styles = v; break;
                case"properties" : this.properties = v; break;
                case"attributes" : this.attributes = v; break;
                case"events" : this.events = v; break;
                default: this[k] = v; break; 
            }
        });
    Object.seal(this);
    }
};
```
* 기존코드 역시 중복최소화
* observer에서 해당 subject의 상태를 지켜보고 있으며 subject 변경 시 반영

### subject
```javascript
const ViewModel = class {
    // ... 
    #isUpdated = new Set; #listeners = new Set;
    addListener(v, _=type(v, ViewModelListener)){ this.#listeners.add(v); }
    removeListener(v, _=type(v, ViewModelListener)) { this.#listeners.delete(v); }
    notify() {
        this.#listeners.forEach(v=>v.viewmodelUpdated(this.#isUpdated ));     
    };
    styles ={}; properties = {}; events = {}; attributes = {};
    // ....
    constructor(checker, data) {
        //....         
    }
}
```
* 일반적인 subject
* notify 에서 모든 리스너를 돌아 isUpdated를 통해 입력된 변화를 반영한다.

### 기능의 일반화와 defineProperty

```javascript

const ViewModelListener = class{
    viewmodelUpdated(updated) {throw "override"}
};


const ViewModelValue = class {
    cat; k; v;
    
    constructor(cat, k, v ){
        this.cat = cat;
        this.k = k;
        this.v = v;
        Object.freeze(this);
    }
    
};

const ViewModel = class extends ViewModelListener{
    constructor(checker, data) {
        super();
        Object.entries(data).forEach(([k,v])=>{
           if("styles,attributes,properties".includes(k)){
               this[k] = Object.defineProperties(v, 
               Object.entries(v).reduce((r,[k1,v1])=>{
                  r[k1] = {
                      enumerable : true,
                      get:_=>v1,
                      set:newV =>{
                          v1 = newV;
                          this.#isUpdated.add(
                              new ViewModelValue(k, k1, v1)
                          );
                      }
                  };
                  return r;
               },{})) 
           }else {
               Object.defineProperty(this, k, {
                   enumerable : true,
                   get: _=> v,
                   set: newV=>{
                       v= newV;
                       this.#isUpdated.add(
                           new ViewModelValue("",k ,v)
                       );
                   }
               });
           }
            Object.seal(this);
        });
    };
}
```
* defineProperty로 Viewmodel을 get,set을 생성
* set에 입력 시 변경점이 입력됨

```javascript
const ViewModelValue = class {
    subKey; cat; k; v;
    
    constructor(subKey, cat, k, v ){
        this.cat = cat;
        this.k = k;
        this.v = v;
        Object.freeze(this);
    }
    
};
// ..... 

    
parent =null; subKey = "";
//... 
//....
else {
    Object.defineProperty(this, k, {
    enumerable : true,
    get: _=> v,
    set: newV=>{
        v= newV;
        this.#isUpdated.add(
            new ViewModelValue(this.subKey,"",k ,v)
        );
    }});
}
if( v instanceof ViewModel) 
{
    v.parent = this;
    v.subKey = k;
    v.addListener(this);
}
```
* 부모에서 하위 자식클래스를 리슨하기 위해 컴포지트패턴을 사용


### Observer
Binder 에서 subject를 리슨 대기 하고 있어야함
```javascript

const Binder = class extends ViewModelListener{
    #items= new Set(); #processores ={};
    
    viewmodelUpdated(updated) {
        const items ={};
        this.#items.forEach(item=>{ //items를 object 로 만드는 과정..
                items[item.viewmodel] = [
                    type(viewmodel[item.viewmodel] , ViewModel),
                    item.el
                ]
        });
        updated.forEach(v=>{
            if(!items[v.subKey]) return;
            const [vm,el] = items[v.subKey], processor = this.#processors[v.cat];
            if(!el || !processor) return;
            processor.process(vm, el, v.k, v.v);
        });
    }

    //...
    //...
    watch(viewmodel, _=type(viewmodel, ViewModelListener)){
        viewmodel.addListener(this);
        this.render(viewmodel);
    }
    unWatch(viewmodel, _=type(viewmodel, ViewModelListener)){
        viewmodel.removeListener(this); 
    }
    
}
```
* watch를 통해 binder에서 viewModel을 관찰
