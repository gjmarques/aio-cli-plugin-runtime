/*
Copyright 2019 Adobe Inc. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const TheCommand = require('../../../../src/commands/runtime/trigger/delete.js')
const RuntimeBaseCommand = require('../../../../src/RuntimeBaseCommand.js')
const ow = require('openwhisk')()
const { stdout } = require('stdout-stderr')
const owAction = 'triggers.delete'

test('exports', async () => {
  expect(typeof TheCommand).toEqual('function')
  expect(TheCommand.prototype instanceof RuntimeBaseCommand).toBeTruthy()
})

test('description', async () => {
  expect(TheCommand.description).toBeDefined()
})

test('aliases', async () => {
  expect(TheCommand.aliases).toBeDefined()
  expect(TheCommand.aliases).toBeInstanceOf(Array)
  expect(TheCommand.aliases.length).toBeGreaterThan(0)
})

test('args', async () => {
  const triggerPath = TheCommand.args[0]

  expect(triggerPath).toBeDefined()
  expect(triggerPath.name).toEqual('triggerPath')
  expect(triggerPath.required).toEqual(true)
  expect(triggerPath.description).toBeDefined()
})

// eslint-disable-next-line jest/expect-expect
test('base flags included in command flags',
  createTestBaseFlagsFunction(TheCommand, RuntimeBaseCommand)
)

describe('instance methods', () => {
  let command, handleError

  beforeEach(() => {
    command = new TheCommand([])
    handleError = jest.spyOn(command, 'handleError')
  })

  describe('run', () => {
    test('exists', async () => {
      expect(command.run).toBeInstanceOf(Function)
    })

    test('simple trigger delete', () => {
      return new Promise((resolve) => {
        const cmd = ow.mockResolved(owAction, '')
        ow.mockResolved('triggers.get', {})

        command.argv = ['trigger1']
        return command.run()
          .then(() => {
            expect(cmd).toHaveBeenCalledWith({ name: 'trigger1', namespace: null })
            expect(stdout.output).toMatch('')
            resolve()
          })
      })
    })

    test('simple trigger delete with feed', () => {
      return new Promise((resolve) => {
        const cmd = ow.mockResolved(owAction, '')
        const cmdfeed = ow.mockResolved('feeds.delete', '')
        ow.mockResolved('triggers.get', {
          annotations: [
            {
              key: 'feed',
              value: '/whisk.system/alarms/alarm'
            }
          ],
          name: 'trigger1'
        })

        command.argv = ['trigger1']
        return command.run()
          .then(() => {
            expect(cmdfeed).toHaveBeenCalledWith({ name: '/whisk.system/alarms/alarm', trigger: 'trigger1' })
            expect(cmd).toHaveBeenCalledWith({ name: 'trigger1', namespace: null })
            expect(stdout.output).toMatch('')
            resolve()
          })
      })
    })

    test('simple trigger delete with annotations - no feed(codecov)', () => {
      return new Promise((resolve) => {
        const cmd = ow.mockResolved(owAction, '')
        const cmdfeed = ow.mockResolved('feeds.delete', '')
        ow.mockResolved('triggers.get', {
          annotations: [
            {
              key: 'key1',
              value: 'value1'
            }
          ],
          name: 'trigger1'
        })

        command.argv = ['trigger1']
        return command.run()
          .then(() => {
            expect(cmdfeed).not.toHaveBeenCalled()
            expect(cmd).toHaveBeenCalledWith({ name: 'trigger1', namespace: null })
            expect(stdout.output).toMatch('')
            resolve()
          })
      })
    })

    test('simple trigger delete with namespace in trigger name', () => {
      return new Promise((resolve) => {
        const cmd = ow.mockResolved(owAction, '')
        ow.mockResolved('triggers.get', {})
        command.argv = ['/MySpecifiedNamespace/trigger1']
        return command.run()
          .then(() => {
            expect(cmd).toHaveBeenCalledWith({ name: 'trigger1', namespace: 'MySpecifiedNamespace' })
            expect(stdout.output).toMatch('')
            resolve()
          })
      })
    })

    test('trigger delete, error', () => {
      return new Promise((resolve, reject) => {
        const err = new Error('an error')
        ow.mockRejected(owAction, err)
        ow.mockResolved('triggers.get', {})

        command.argv = ['trigger1']
        return command.run()
          .then(() => reject(new Error('does not throw error')))
          .catch(() => {
            expect(handleError).toHaveBeenLastCalledWith("Unable to delete trigger 'trigger1'", new Error('an error'))
            resolve()
          })
      })
    })
  })
})
