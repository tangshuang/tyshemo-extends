import { Dict, ifexist, equal, determine, Positive, SelfReference } from 'tyshemo'
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
  test('mock selfreference', () => {
    const SomeType = new SelfReference((type) => new Dict({
      name: 'ok',
      children: [type],
    }))

    const mocker = new TypeMocker()
    const data = mocker.mock(SomeType)
    expect(data.name).toBe('ok')
  })
})
