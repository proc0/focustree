const BASE_NAME = 'taskbase'
const BASE_STORE = 'task'
const BASE_VERSION = 1

class TaskBase extends TaskControl {
  model = {
    // id: 0,
    data: {
      record: [
        // stateStart,
        // stateEnd,
        // timeStart,
        // timeEnd,
      ],
      states: STATES,
    },
    meta: {
      editing: true,
      focused: false,
      opened: false,
    },
    name: NEW_NAME,
    note: '',
    path: [0],
    state: 0,
    tree: [],
  }

  connectedCallback() {
    // initialize view
    this.parentElement.init()
  }

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
      this.loadAll()
    }

    initBase.onupgradeneeded = ({ target }) => {
      console.log('TaskBase upgrade needed.')

      const taskBase = target.result

      taskBase.onerror = (event) => {
        console.error(event.target.error)
      }

      // DB does not exist
      if (!taskBase.objectStoreNames.contains(BASE_STORE)) {
        this.createStore(taskBase)
      } else {
        // migration placeholder
        let migration = null
        // // write incremental migrations according to versions
        // if (oldVersion === 1) { // get oldVersion from event.oldVersion
        //   console.log(`Migrating TaskBase from ${oldVersion} to ${taskBase.version}...`)
        //   // version 1 -> 2 migration
        //   migration = (task) => { // modify task to new version here }
        // }
        this.upgrade(migration)
      }
    }

    const saveEvents = [
      EVENT_BRANCH,
      EVENT_EDIT,
      EVENT_EXPAND,
      EVENT_SAVE,
      EVENT_STATUS,
      EVENT_SYNC,
      EVENT_UPDATE,
    ]
    saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
  }

  addRoot({ detail }) {
    let task = detail?.task

    if (!task) {
      task = structuredClone(this.model)
      // get new task path (order index of root)
      const rootIndex = this.querySelectorAll('& > task-node').length
      task.path = [rootIndex >= 0 ? rootIndex : 0]
    }

    this.store('readwrite', (store) => {
      const addRequest = store.add(task)
      addRequest.onsuccess = ({ target }) => {
        task.id = target.result

        // another request to save the DB key in id
        const putRequest = store.put(task, task.id)
        // only root tasks have id
        putRequest.onsuccess = () => {
          console.log(`Added task ${task.id}`)
          this.dispatchEvent(
            new CustomEvent(EVENT_RENDER_ROOT, {
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

  createStore(taskBase) {
    // create an objectStore for tasks
    const taskStore = taskBase.createObjectStore(BASE_STORE, {
      keypath: 'id',
      autoIncrement: true,
    })

    taskStore.createIndex('name', 'name')

    const taskSeed = structuredClone(TUTORIAL || this.model)
    // only root tasks have id
    taskSeed.id = 1

    const addRequest = taskStore.add(taskSeed)

    addRequest.onsuccess = (event) => {
      console.log(`Added task ${event.target.result}`)
    }

    addRequest.onerror = (event) => {
      console.error(event.target.error)
    }
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
                new CustomEvent(EVENT_RENDER_ROOT, {
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
          new CustomEvent(EVENT_RENDER_ROOT, {
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

  loadAll() {
    console.log('Loading all tasks...')
    this.store('readonly', (store) => {
      const readRequest = store.getAll()
      readRequest.onsuccess = ({ target }) => {
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              tasks: target.result,
            },
          })
        )
      }
      return readRequest
    })
  }

  mapSave(transform) {
    const requestAll = this.store('readwrite', (store) => {
      const readRequest = store.getAll()

      let tasks = []
      readRequest.onsuccess = ({ target }) => {
        const result = target.result
        // sort tasks based on path
        result.sort((a, b) => {
          return a.path[0] > b.path[0] ? 1 : -1
        })

        tasks = transform(result)
        tasks.forEach((task, index) => {
          // root tasks
          if (task.id) {
            // save updated tasks
            const putRequest = store.put(task, task.id)

            putRequest.onsuccess = ({ target }) => {
              console.log(`Updated task ${task.id}`)

              if (index === tasks.length - 1) {
                this.dispatchEvent(
                  new CustomEvent(EVENT_RENDER, {
                    bubbles: true,
                    detail: {
                      tasks,
                    },
                  })
                )
              }
            }

            putRequest.onerror = (event) => {
              console.error(event.target.error)
            }
          } else {
            // promote branch to root
            const addRequest = store.add(task)
            addRequest.onsuccess = (event) => {
              task.id = event.target.result
              // another request to save the DB key in id
              const putRequest = store.put(task, task.id)
              // only root tasks have id
              putRequest.onsuccess = () => {
                console.log(`Added new root task ${task.id}`)

                if (index === tasks.length - 1) {
                  this.dispatchEvent(
                    new CustomEvent(EVENT_RENDER, {
                      bubbles: true,
                      detail: {
                        tasks,
                      },
                    })
                  )
                }
              }

              putRequest.onerror = (event) => {
                console.error(event.target.error)
              }
            }
          }
        })
      }

      return readRequest
    })
  }

  save(event) {
    // stop save events except expand,
    // to allow view to handle it
    if (event.type !== EVENT_EXPAND) {
      event.stopPropagation()
    }

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
      const newTask = structuredClone(this.model)
      newTask.path = [...task.path, task.tree.length]
      task.tree.push(newTask)
      // open drawer
      task.meta.opened = true
    }

    if (event.type === EVENT_STATUS) {
      // limit history to prevent large db size
      if (task.data.record.length > 99) {
        task.data.record.splice(50)
      }
    }

    if (event.type === EVENT_SYNC) {
      // DFS sync all states to the event task
      const syncStates = (t) => {
        t.state = task.state

        if (!t.tree.length) return

        t.tree.forEach((s) => {
          s.state = task.state
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
          new CustomEvent(EVENT_RENDER_BRANCH, {
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

  upgrade(migration) {
    // version upgrade
    const store = target.transaction.objectStore(BASE_STORE)

    const request = store.openCursor()

    request.onsuccess = ({ target }) => {
      const cursor = target.result

      if (!cursor) {
        return console.log('Tasks migration complete.')
      }

      const task = cursor.value
      if (migration) {
        // migrate task and subtasks
        this.transformTask(task, migration)
      }

      // save task migration
      const putRequest = store.put(task, task.id)

      putRequest.onsuccess = (success) => {
        console.log(`Migrated task ${success.target.result}`)
      }

      putRequest.onerror = (event) => {
        console.error(event.target.error)
      }

      cursor.continue()
    }

    request.onerror = ({ target }) => {
      console.error(target.error)
    }
  }
}
