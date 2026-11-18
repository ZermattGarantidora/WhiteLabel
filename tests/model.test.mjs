import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTNER_SHARE,parseBR,calculate,calculatePortfolio,resolveRate} from '../model.mjs';

test('participação do parceiro é fixa em 30% na comissão mensal e anual',()=>{
  assert.equal(PARTNER_SHARE,30);
  const monthly=calculate(100000,4,PARTNER_SHARE);
  assert.equal(monthly.admin,1200);
  assert.equal(monthly.remainder,2800);
  assert.equal(monthly.share,30);
  const annual=calculate(100000,4,PARTNER_SHARE,12);
  assert.equal(annual.admin,14400);
  assert.equal(annual.remainder,33600);
});

for(const share of [0,15,29.99,30.01,50,100]) {
  test(`não permite participação de ${share}%, inclusive em chamadas diretas`,()=>{
    assert.throws(()=>calculate(100000,4,share),/fixa em 30%/);
    assert.throws(()=>calculatePortfolio(1,100000,4,share),/fixa em 30%/);
  });
}

test('carteira, faixas e período mantêm a participação fixa',()=>{
  const monthly=calculatePortfolio(10,100000,4,PARTNER_SHARE,1,[{minimum:10,rate:3.5}]);
  assert.equal(monthly.admin,10500);
  assert.equal(monthly.remainder,24500);
  assert.equal(monthly.share,30);
  const annual=calculatePortfolio(10,100000,4,PARTNER_SHARE,12,[{minimum:10,rate:3.5}]);
  assert.equal(annual.admin,126000);
  assert.equal(annual.share,30);
  assert.equal(calculatePortfolio(0,100000,4,PARTNER_SHARE).admin,0);
});

test('interpreta valores brasileiros, decimais e rejeita entrada inválida',()=>{
  assert.equal(parseBR('R$ 1.234,56'),1234.56);
  assert.equal(parseBR('1.23'),1.23);
  assert.equal(parseBR('0'),0);
  assert.ok(Number.isNaN(parseBR('abc')));
});

test('preserva os limites do cálculo de comissão',()=>{
  for(const args of [[-1,4,30],[1e12+1,4,30],[NaN,4,30],[100000,-1,30],[100000,101,30],[100000,4,NaN],[100000,4,30,2]]) {
    assert.throws(()=>calculate(...args),RangeError);
  }
  assert.equal(calculate(0,0,30).admin,0);
  assert.equal(calculate(100,100,30).admin,30);
});

test('faixa atingida usa a maior quantidade mínima, independentemente da ordem',()=>{
  const tiers=[{minimum:20,rate:3},{minimum:10,rate:3.5}];
  assert.deepEqual(resolveRate(20,4,tiers),{rate:3,appliedThreshold:20});
  assert.deepEqual(resolveRate(5,4,tiers),{rate:4,appliedThreshold:0});
});

test('preserva validação de quantidade, arrecadação e faixas',()=>{
  for(const quantity of [-1,0.5,100001]) assert.throws(()=>calculatePortfolio(quantity,100000,4,30),RangeError);
  for(const base of [-1,Infinity,1e12+1]) assert.throws(()=>calculatePortfolio(1,base,4,30),RangeError);
  assert.throws(()=>calculatePortfolio(2,1e12,4,30),RangeError);
  for(const args of [[-1,4],[0.5,4],[100001,4],[1,-1],[1,101],[1,NaN],[1,4,null]]) assert.throws(()=>resolveRate(...args),RangeError);
  for(const tiers of [
    [{minimum:0,rate:4}],[{minimum:100001,rate:4}],[{minimum:1,rate:-1}],
    [{minimum:1,rate:101}],[{minimum:1,rate:NaN}],[{minimum:1,rate:4},{minimum:1,rate:3}]
  ]) assert.throws(()=>resolveRate(10,4,tiers),RangeError);
});
