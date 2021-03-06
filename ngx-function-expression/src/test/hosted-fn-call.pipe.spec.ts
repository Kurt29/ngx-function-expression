import {TestBed} from '@angular/core/testing';
import {FnCallPipe} from '../lib/fn-call.pipe';
import {Component} from '@angular/core';
import {FunctionExpression} from '../lib/fn-function-expression.type';
import {BehaviorSubject} from 'rxjs';
import {FnEvaluationService} from '../lib/fn-evaluation.service';
import createSpy = jasmine.createSpy;

@Component({
  template: '{{activeFunctionExpression | fnCall}}'
})
export class TestHostComponent {
  activeFunctionExpression: FunctionExpression<any> = null;

  setExpression(expr: FunctionExpression<any>) {
    this.activeFunctionExpression = expr;
  }
}

@Component({
  template: '{{activeFunctionExpression | fnCall | async}}'
})
export class AsyncTestHostComponent {
  activeFunctionExpression: FunctionExpression<any> = null;

  setExpression(expr: FunctionExpression<any>) {
    this.activeFunctionExpression = expr;
  }
}

describe('Hosted Pipe: fnCall', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent, AsyncTestHostComponent, FnCallPipe]
    }).compileComponents();
    TestBed.inject(FnEvaluationService).suppressWarnings();
  });

  it('should correctly infer the wrapping component', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy();
    fixture.componentInstance.setExpression(spy);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.calls.first().object).toBe(fixture.componentInstance);
  });

  it('should call the host function exactly once', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy().and.returnValue(null);
    fixture.componentInstance.setExpression(spy);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should display the result of the host function', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy().and.returnValue('called');
    fixture.componentInstance.setExpression(spy);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fixture.debugElement.nativeElement.innerText).toContain('called');
  });

  it('should call functions with arguments', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy();
    fixture.componentInstance.setExpression([spy, 1, 2]);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(1, 2);
  });

  it('should set the correct context', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy();
    const object = {};
    fixture.componentInstance.setExpression([object, spy, 1]);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy.calls.first().object).toBe(object);
  });

  it('should work with method expressions', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const spy = createSpy();
    const object = {
      test: spy as () => string
    };
    fixture.componentInstance.setExpression([object, 'test', 1]);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy.calls.first().object).toBe(object);
  });

  it('should work with returned observables', async () => {
    const fixture = TestBed.createComponent(AsyncTestHostComponent);
    const subject = new BehaviorSubject(1);
    const spy = createSpy().and.returnValue(subject);
    fixture.componentInstance.setExpression([spy, 1, 2]);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.innerText).toContain('1');
    subject.next(2);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.innerText).toContain('2');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
