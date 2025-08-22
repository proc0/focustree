const BASE_NAME = 'taskbase'
const BASE_VERSION = 2
const BASE_STORE = 'task'

const MODEL_TASK = {
  // id: 1, (root only)
  path: [0],
  meta: {
    opened: false,
    editing: true,
  },
  name: 'New Task: Edit name.',
  note: '',
  state: {
    current: 0,
    focused: false,
    history: [],
    options: STATES_TASK,
  },
  subs: [],
}

// V2 task history model
// records how much time was spent focusing
// and whether or not it was paused
// {
//   stateStart,
//   stateEnd,
//   timeStart,
//   timeEnd,
// }

class TaskBase extends HTMLElement {
  constructor() {
    super()
    const initBase = window.indexedDB.open(BASE_NAME, BASE_VERSION)

    initBase.onerror = ({ target }) => {
      console.log(target.error)
    }

    initBase.onsuccess = ({ target }) => {
      console.log('TaskBase initialized.')
      // save taskBase reference
      this.taskBase = target.result
      this.load()
    }

    initBase.onupgradeneeded = ({ target, oldVersion }) => {
      console.log('TaskBase upgrade needed.')

      const taskBase = target.result

      taskBase.onerror = (event) => {
        console.error(event.target.error)
      }

      // DB does not exist
      if (!taskBase.objectStoreNames.contains(BASE_STORE)) {
        // create an objectStore for tasks
        const taskStore = taskBase.createObjectStore(BASE_STORE, {
          keypath: 'id',
          autoIncrement: true,
        })

        taskStore.createIndex('name', 'name')

        const taskSeed = structuredClone(TUTORIAL || MODEL_TASK)
        // only root tasks have id
        taskSeed.id = 1

        const addRequest = taskStore.add(taskSeed)

        addRequest.onsuccess = (event) => {
          console.log(`Added task ${event.target.result}`)
        }

        addRequest.onerror = (event) => {
          console.error(event.target.error)
        }
      } else {
        // version upgrade
        const store = target.transaction.objectStore(BASE_STORE)

        const traverseTask = (task, transform) => {
          transform(task)
          if (!task.subs.length) return

          task.subs.forEach((sub) => {
            traverseTask(sub, transform)
          })
        }
        // pick migration function according to version
        let migration = (a) => a
        if (oldVersion === 1) {
          console.log(`Migrating TaskBase from ${oldVersion} to ${taskBase.version}...`)
          // version 2 changes task state history model
          migration = (task) => {
            task.state.history = task.state.history.map((entry) => ({
              stateStart: entry.state,
              stateEnd: entry.state,
              timeStart: entry.time,
              timeEnd: entry.time,
            }))
          }
        }

        const request = (store.openCursor().onsuccess = ({ target }) => {
          const cursor = target.result

          if (!cursor) {
            return console.log('Tasks migration complete.')
          }

          const task = cursor.value
          // migrate task and subtasks
          traverseTask(task, migration)

          // save task migration
          const putRequest = store.put(task, task.id)

          putRequest.onsuccess = (success) => {
            console.log(`Migrated task ${success.target.result}`)
          }

          putRequest.onerror = (event) => {
            console.error(event.target.error)
          }

          cursor.continue()
        })

        request.onerror = ({ target }) => {
          console.error(target.error)
        }
      }
    }

    const saveEvents = [
      EVENT_BRANCH,
      EVENT_EDIT,
      EVENT_EXPAND,
      EVENT_STATES,
      EVENT_SYNC,
      EVENT_UPDATE,
    ]
    saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
  }

  addRoot() {
    this.store('readwrite', (store) => {
      const task = structuredClone(MODEL_TASK)
      const addRequest = store.add(task)

      addRequest.onsuccess = ({ target }) => {
        task.id = target.result

        // another request to save the DB key in id
        const putRequest = store.put(task, task.id)
        // only root tasks have id
        putRequest.onsuccess = () => {
          console.log(`Added task ${task.id}`)
          this.dispatchEvent(
            new CustomEvent(EVENT_RENDER, {
              bubbles: true,
              detail: {
                task,
              },
            })
          )
        }

        putRequest.onerror = (event) => {
          console.error(event.target.error)
        }
      }

      return addRequest
    })
  }

  export() {
    console.log('Exporting tasks...')

    this.store('readonly', (store) => {
      const readRequest = store.getAll()

      readRequest.onsuccess = ({ target }) => {
        const tasks = target.result
        console.log(tasks)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(
          new Blob([JSON.stringify(tasks, null, 2)], {
            type: 'text/plain',
          })
        )
        a.setAttribute('download', 'tasks.json')
        this.appendChild(a)
        a.click()
        this.removeChild(a)
      }

      return readRequest
    })
  }

  import() {
    console.log('Importing tasks...')
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.addEventListener('change', (event) => {
      const file = event.target.files[0]

      if (!file) {
        conosole.Error('No file selected. Please choose a file.')
        return
      }

      const reader = new FileReader()

      reader.onload = () => {
        const tasks = JSON.parse(reader.result)
        console.log(tasks)

        this.store('readwrite', (store) => {
          tasks.forEach((task) => {
            const addRequest = store.add(task, task.id)

            addRequest.onsuccess = ({ target }) => {
              console.log(`Imported task ${target.result}`)
              this.dispatchEvent(
                new CustomEvent(EVENT_RENDER, {
                  bubbles: true,
                  detail: {
                    task,
                  },
                })
              )
            }

            addRequest.onerror = (event) => {
              console.error(event.target.error)
            }
          })
        })
        input.remove()
      }

      reader.onerror = () => {
        conosole.Error('Error reading the file. Please try again.')
      }
      reader.readAsText(file)
    })

    input.click()
  }

  load() {
    console.log('Loading tasks...')

    this.store('readonly', (store) => {
      const readRequest = (store.openCursor().onsuccess = ({ target }) => {
        const cursor = target.result

        if (!cursor) {
          return console.log('Tasks loading complete.')
        }

        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              task: cursor.value,
            },
          })
        )

        cursor.continue()
      })

      return readRequest
    })
  }

  delete(event) {
    const node = event.target
    // root task delete
    if (node.task.id) {
      // bubbles up to task view
      return this.store('readwrite', (store) => {
        const taskKey = node.task.id
        const deleteRequest = store.delete(taskKey)

        deleteRequest.onsuccess = () => {
          console.log(`Deleted task ${taskKey}`)
        }

        return deleteRequest
      })
    }
    // branch task delete
    // is a root save
    this.save(event)
  }

  save(event) {
    // stop save event
    event.stopPropagation()

    let node = event.target
    // when deleting a subtask,
    if (event.type === EVENT_DELETE) {
      // grab the parent
      node = event.target.parentElement
    }

    // grab root element
    let root = event.target
    const pathLength = event.target.task.path.length
    if (pathLength > 1) {
      for (let i = 0; i < pathLength - 1; i++) {
        root = root.parentElement
      }
    }

    // add new task if branching
    const task = event.detail.task
    if (event.type === EVENT_BRANCH) {
      // create new task and add path
      const newTask = structuredClone(MODEL_TASK)
      newTask.path = [...task.path, task.subs.length]
      // set edit if editing
      newTask.meta.editing = task.meta.editing
      task.subs.push(newTask)
      // open drawer
      task.meta.opened = true
    }

    if (event.type === EVENT_STATES) {
      // limit history to prevent large db size
      if (task.state.history.length > 99) {
        task.state.history.splice(50)
      }
    }

    if (event.type === EVENT_SYNC) {
      // DFS sync all states to the event task
      const syncStates = (t) => {
        t.state.current = task.state.current

        if (!t.subs.length) return

        t.subs.forEach((s) => {
          s.state.current = task.state.current
          syncStates(s)
        })
      }

      syncStates(task)
    }

    this.store('readwrite', (store) => {
      const putRequest = store.put(root.task, root.task.id)

      putRequest.onsuccess = (success) => {
        console.log(`Updated task ${success.target.result}`)
        if (event.type === EVENT_EXPAND) {
          // does not need a render
          return
        }

        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              node,
              task,
            },
          })
        )
      }

      return putRequest
    })
  }

  store(operation, order) {
    const store = this.taskBase.transaction(BASE_STORE, operation).objectStore(BASE_STORE)

    const request = order(store)

    if (!request) {
      return
    }

    request.onerror = ({ target }) => {
      console.error(target.error)
    }

    return request
  }
}
