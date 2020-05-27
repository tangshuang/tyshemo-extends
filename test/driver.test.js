import Driver from '../src/driver.js'

describe('Driver', () => {
  test('type', () => {
    const json = {
      name: 'string',
      age: 'number',
    }

    const driver = new Driver()
    const type = driver.type(json)

    expect(() => type.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => type.assert({ name: null })).toThrowError()
  })
  test('mocker', () => {
    const json = {
      name: 'string',
      age: 'number',
    }

    const driver = new Driver()
    const mocker = driver.mocker(json)

    expect(typeof mocker.name).toBe('string')
    expect(typeof mocker.age).toBe('number')
  })
  test('model', () => {
    const json = {
      name: {
        default: 'tomy',
        type: 'string',
      },
      age: {
        default: 10,
        type: 'number',
      },
    }

    const driver = new Driver()
    const Model = driver.model(json)
    class SomeModel extends Model {
      onError() {}
    }
    const model = new SomeModel()

    expect(model.name).toBe('tomy')
    expect(model.age).toBe(10)

    model.age = '0'
    expect(model.age).toBe(10)
  })
})
