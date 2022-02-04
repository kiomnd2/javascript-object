/**
 * 제어의 역전 개념과 필요성
 *
 * 개념
 * 1. Control = 프름제어
 * 2. 광의에서의 흐름 제어 = 프로그램 실행 통제
 * 3. 동기흐름제어, 비동기 흐름제어
 * 역전 : 내가 안하고
 *
 * 문제점
 * 1. 흐름 제어는 상태와 결합하여 진행됨
 * 2. 상태 통제와 흐름제어 = 알고리즘
 * 3. 변화에 취약하고 구현하기도 어려움
 *
 * 대안
 * 1. 제어를 추상화하고
 * 2. 개별 제어의 차이점만 외부에서 주입받는다
 *
 * 제어역전 실제 구현
 *
 * 전략패턴 & 탬플림 메소드 패턴 < 컴포지트 패턴 < 비지터 패턴
 * 보다 넒은 범위의 제어 역전을 실현함
 *
 * 추상팩토리 메소드 패턴
 * 왼쪽 패턴은 이미 만들어진 객체의 행위를 제어역전에 참여시킬 수 있지만 참여할 객체 자체를 생성할 수 없음
 * 참여할 객체를 상황에 맞게 생성하고 행위까지 윟임하기 위해 추상 팩토리 메소드를 사용
 **/

const Renderer = class {
    #view = null; #base = null;
    constructor(baseElement) {
        this.#base = baseElement;
    }

    // base 앨리먼트에 View를 넣어서 랜더링
    set view(v) {
        if (v instanceof View) this.#view = v;
        else throw `invalid view :${v}`;
    }

    // 모든 view를 만들어낼 때 제어를 이친구가 함 이제 제어는 여기서만 함, 중복된 코드가 나올수 없다
    render(data) {
        const base = this.#base, view = this.#view;
        if (!base || !view) throw `no base or view`;
        let target = base.firstElementChild; // base의 첫번째 자식
        do base.removeChild(target); while (target = target.nextElementSibling); // base를 비워주는 과정
        base.appendChild(view.getElement(data));
        view.initAni();
        view.startAni();
    }
}

const View = class {
    getElement(data) {throw 'override'; }
    initAni(){throw 'override'};
    startAni(){throw 'override'};
}

const renderer = new Renderer(document.body);
renderer.view = new class extends View {
    #el;
    getElement(data) {
        this.#el = document.createElement('div');
        this.#el.innerHTML = `<h2>${data.title}</h2><p>${data.description}</p>`;
        this.#el.style.cssText = `width:100%; background:${data.background}`;
        return this.#el;
    }

    initAni() {
        const style = this.#el.style;
        style.marginLeft = "100%";
        style.transition = "all 0.3s";
    }

    startAni() {
        requestAnimationFrame(_=>this.#el.style.marginLeft = 0);
    }
}

renderer.render({title: 'testtitle', description: 'contents .. ', background: '#ffffaa'});