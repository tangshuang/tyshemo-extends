import { Dict, ifexist, equal, determine, Positive } from 'tyshemo'
import TypeMocker from '../src/type-mocker.js'

describe('Mocker', () => {
  test('mock', () => {
    const type = new Dict({
      name: String,
      age: Number,
      dog: ifexist(Number),
      sex: equal('M'),
      haul: determine(data => data.sex === 'M' ? Positive : 0),
    })
    const mocker = new TypeMocker()
    const data = mocker.mock(type)
    expect(data.haul > 0).toBe(true)
  })
})
