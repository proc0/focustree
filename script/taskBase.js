const BASE_NAME = 'taskbase'
const BASE_VERSION = 1
const BASE_STORE = 'task'

// TODO: review how to distinguish root
// from subtasks, should it be a meta prop?
// what is id useful for in subtasks?
const MODEL_TASK = {
  // id: 1, (root only)
  path: [0],
  meta: {
    isOpen: false,
  },
  name: 'Le Task',
  note: 'Lorem Ipsum dolor sit amet.',
  state: {
    options: STATES_TASK,
    current: 0,
    history: [],
  },
  subs: [],
}

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

    initBase.onupgradeneeded = ({ target }) => {
      console.log('TaskBase upgrade needed.')

      const taskBase = target.result

      taskBase.onerror = (event) => {
        console.error(event.target.error)
      }

      // create an objectStore for tasks
      const taskStore = taskBase.createObjectStore(BASE_STORE, {
        autoIncrement: true,
      })

      const taskSeed = structuredClone(MODEL_TASK)
      taskSeed.id = 1

      // TODO: detect if IDB is empty and then seed. Otherwise, call some custom migration or leave WIP
      const addRequest = taskStore.add(taskSeed)

      addRequest.onsuccess = (event) => {
        console.log(`Added task ${event.target.result}`)
      }

      addRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    const saveEvents = [EVENT_BRANCH, EVENT_UPDATE, EVENT_EXPAND, EVENT_STATES]
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
      task.subs.push(newTask)
      // open drawer
      task.meta.isOpen = true
    }

    if (event.type === EVENT_STATES) {
      const stateChange = {
        state: task.state.current,
        time: Date.now(),
      }
      task.state.history.push(stateChange)
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

    request.onerror = ({ target }) => {
      console.error(target.error)
    }

    return request
  }
}
