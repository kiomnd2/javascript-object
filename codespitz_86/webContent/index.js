`use strict`;
const type = (target, type) => {
    if(typeof type == "string") {
        if(typeof target != type) throw `invalid type ${target} : ${type}`
    }else if(!(target instanceof type)) throw `invalid type ${target} : ${type}`
    return target;
};

const ViewModelListener = class {
    viewmodelUpdated(updated) {throw "override"; }
};

const ViewModelValue = class {
    subKey; cat;k;v; // subkey는 내것인지 자식인건지 알아야
    constructor(subKey,cat, k, v){
        this.subKey = subKey;
        this.cat = cat;
        this.k = k ;
        this.v = v;
        Object.freeze(this);
    }
};

const ViewModel = class extends ViewModelListener{
    static #subjects = new Set; //옵저버에 통보할 서브젝트 모음
    static #inited = false; // 최초에만 requestAnimationFrame발동
    static notify(vm) {
        this.#subjects.add(vm);
        if(this.#inited) return; //최초 한버닝라도 됬으면 추가만
        this.#inited = true; //이니셜라이즈가 안됐엇으면
        const f =_=>{
            this.#subjects.forEach(vm=>{
                if(vm.#isUpdated.size){ // 한번이라도 변경 됬다면
                    vm.notify(); //변화부는 노티파이
                    vm.#isUpdated.clear() // 초기화 ! 단한번만 노티파이 되고나면 set이 들어오기 전까진 notify 안함
                }
            });
            requestAnimationFrame(f); //발동
        };
        requestAnimationFrame(f)
    }

    subKey = ""; parent =null;
    static #private = Symbol();
    static get(data) {
        return new ViewModel(this.#private, data)
    }
    // viewModel은 subject 이기 때문에 listener을 가지고 있어야 notification을 해줄 수 있다
    #isUpdated = new Set; #listeners = new Set;
    addListener(v, _=type(v,ViewModelListener)){
        this.#listeners.add(v);
    }
    removeListener(v, _=type(v, ViewModelListener)){
        this.#listeners.delete(v);
    }
    notify(){
        this.#listeners.forEach(v=>v.viewmodelUpdated(this.#isUpdated));
    }
    //옵저버 패턴의 서브젝트들
    styles= {}; attributes ={} ; properties  ={}; events ={}; // viewmodel의 속성
    constructor(checker, data, _=type(data,"object")) {
        /*if(checker != ViewModel.#private ) throw new Error('use ViewModel get() !');
        Object.entries(data).forEach(([k,v])=>{
            switch(k) {
                case"styles":this.styles = v; break;
                case"attributes":this.attributes =   v ; break;
                case"properties":this.properties = v; break;
                case"event":this.events=v; break;
                default: this[k] = v ;
            }
        });
        */
        super();
        Object.entries(data).forEach(([k,v])=>{
            if("styles,attributes,properties".includes(k)) { // 자바스크립트에서 indexof는 빠르다. 인라인루프를 돌기 때문
                //기존에는 v값을 넣었지만 이번에는 defineProperties를 사용, set를 감시하기 위해서
                this[k] = Object.defineProperties(v,
                    Object.entries(v).reduce((r,[k1,v1])=>{ //obj의 엔트리스는 2차원 배열을 받음
                        r[k1] ={
                            enumerable:true,
                            get:_=>v1,
                            set:newV =>{
                                v1 = newV; //함수가 돌때마다 새로 가져오는 v에 새로v값을 넣어줌 v는 스코프변수
                                this.#isUpdated.add(
                                    new ViewModelValue(k, k1, v1)
                                ); // vm에 있는 업데이트에 뭔가를 넣어줌
                            }
                        };
                    },{}))
            }else{
                Object.defineProperty(this, k, {
                    enumerable : true,
                    get:_=>v,
                    set:newV=>{
                        v= newV;
                        this.#isUpdated.add(new ViewModelValue( this.subKey, "",k,v));
                    }
                });
                if(v instanceof ViewModel) { // 서브트리의 변화도 위로 보고 해야함..
                    v.parent = this;
                    v.subKey = k; //서브키 할당 버스키가 없을경우 ROOT
                    v.addListener(this); //나는 자식에 대해 리스너가 되어 있어야함
                }
            }
        });
        this.notify(this); //첫번재 데이터가 완성되고 나면 변화가 없지만 처음에 만들어지면 notify를 쳐줘야함
        //requestAnimationFrame한번당 notify를 한번 해줘야함
        Object.seal(this);
    }
    viewmodelUpdated(updated) {
        updated.forEach(v=>this.#isUpdated.add(v)); //위 내용 통째로 updated에 넣는다.
    }
};


//외부에서 의존성을 주입받아야 한다
const Processor = class {
    cat ; // 카테고리 분류
    constructor(cat) {
        this.cat = cat;
        Object.freeze(this);
    }
    process(vm, el, k, v, _0 = type(vm, ViewModel), _1 = type(el, HTMLElement), _2 = type(k, "string")){
        this._process(vm, el, k, v)  // Hook 자식을 통해 부족한 부분을 위임하여 처리
    }
    _process(vm, el, k, v) { throw "override"; } // 탬플릿 메서드 패턴
};

/**
 *  new (class extends Processor {
 *      _process(vm ,el, k, v) { el.styles[k] = v }
 *  }("styles")
 */


const BinderItem = class {
    el; viewmodel;
    constructor(el, viewmodel, _0=type(el,HTMLElement), _1=type(viewmodel, "string")) {
        this.el = el;
        this.viewmodel = viewmodel;
        Object.freeze(this);
    }
    
};


const Binder = class extends ViewModelListener{
    #items = new Set(); #processors ={};

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

    add(v, _=type(v, BinderItem)){ this.#items.add(v) }
    addProcessor(v, _0 = type(v,Processor)) {
        this.#processors[v.cat] = v ;
        //SET을 안쓰는 이유는 같은 키를 중복이 안일어나게 하기위해 예를 들어 Styles가 중복해서 들어갔을ㄸ ㅐ갈아치우게 하기 위해
        // v.cat을 값으로 쓰는 이유는 카테고리의 형태가 다양하게 일어날수 있다. Symbol 형태로 왔을 때 일일이 그 카테고리를 정의해 줘야한다
    } // 프로세서를 등록할 함수
    render(viewmodel, _=type(viewmodel, ViewModel )) {
        const processores = Object.entries(this.#processors);
        this.#items.forEach(item => {
            const vm = type(viewmodel[item.viewmodel], ViewModel) , el = item.el;
/*            Object.entries(vm.styles).forEach(([k,v])=>el.style[k] =v );
            Object.entries(vm.attributes).forEach(([k,v])=>el.setAttribute(k,v));
            Object.entries(vm.properties).forEach(([k,v])=>el[k]=v);
            Object.entries(vm.events).forEach(([k,v])=>el["on" +k]=e => v.call(el,e,viewmodel));
           */ // 코드의 객체화
            processores.forEach(([pk,processor]) =>{ //pk에 cat processor에 v값 (Processor)이 나옴
                Object.entries(vm[pk]).forEach(([k,v])=>{ //vm모델에서 해당 카테고리에 대한 값을 가지고와서 거기에 대한 k,v값을 가지고 옴
                    processor.process(vm, el, k, v); //객체 사이의 의존성 .. (계약)
                }) ;
            });
        })
    }
    watch(viewmodel, _=type(viewmodel,ViewModel)) { //내가 특정 뷰모델에 리스너로써 등록되거나 말거나
        viewmodel.addListener(this);
        this.render(viewmodel);
    }
    unwatch(viewmodel, _= type(viewmodel, ViewModel)){
        viewmodel.removeListener(this);
    }

};


const Scanner = class {
    scan(el, _=type(el, HTMLElement)){
        const binder = new Binder;
        this.checkItem(binder,el);
        const stack = [el.firstElementChild];
        let target;
        while(target = stack.pop()) {
            this.checkItem(binder, target);
            if (target.firstElementChild) stack.push(target.firstElementChild); // 자식..
            if (target.nextElementSibling) stack.push(target.nextElementSibling); //형제..
        }
        return binder;
        
    };
    checkItem(binder,el) {
        const vm = el.getAttribute("data-viewmodel");
        if(vm) binder.add(new BinderItem(el,vm));
    }
    
};

const viewmodel = ViewModel.get({
    wrapper : ViewModel.get({
        styles :{
            width : "100%",
            background : "#ffa",
            cursor :"pointer"
        }
    }),
    title : ViewModel.get({
        properties: {
            innerHTML: "title"
        }
    }),
    contents : ViewModel.get({
        properties : {
            innerHTML : "Content"
        }
    })
});


const scanner = new Scanner;
const binder = scanner.scan(document.querySelector("#target"));
binder.addProcessor(new( class extends Processor {
    _process(vm, el, k, v) {
        el.style[k] = v;
    }
})("styles"));

binder.addProcessor(new( class extends Processor {
    _process(vm, el, k, v) {
        el.setAttribute(k,v);
    }
})("attributes"));

binder.addProcessor(new( class extends Processor {
    _process(vm, el, k, v) {
        el[k] =v ;
    }
})("properties"));

binder.addProcessor(new( class extends Processor {
    _process(vm, el, k, v) {
        el["on"+k] =e => v.call(el,e,vm);
    }
})("events"));
// binder -> processor 바인더가 프로세서를 의존하게 되었다
// 코드를 객체로 만들 -> 의존성 주입이 없다면 잘못만든거 ..
binder.render(viewmodel);
