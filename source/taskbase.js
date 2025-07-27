class TaskbaseElement extends HTMLElement {
  constructor() {
    super()
    const taskbase = window.indexedDB.open(TASKBASE_NAME, TASKBASE_VERSION)

    taskbase.onerror = (event) => {
      console.log(event.target.error)
    }

    taskbase.onsuccess = (event) => {
      console.log('Taskbase initialized.')
      // save taskbase reference
      this.taskbase = event.target.result
      this.load()
    }

    taskbase.onupgradeneeded = (event) => {
      console.log('Taskbase upgrade needed.')

      const tb = event.target.result

      tb.onerror = (event) => {
        console.error(event.target.error)
      }

      // create an objectStore for tasks
      const taskStore = tb.createObjectStore(TASKBASE_STORE, {
        autoIncrement: true,
      })

      const addRequest = taskStore.add(SEED_TASK)

      addRequest.onsuccess = (event) => {
        console.log(`Added task ${event.target.result}`)
      }

      addRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    const saveEvents = [EVENT_BRANCH, EVENT_UPDATE, EVENT_DELETE, EVENT_EXPAND]
    saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
  }

  //TODO: refactor save, separate delete and another save function with a parent function calling both
  save(event) {
    let taskElement = event.target
    const taskStore = this.taskbase
      .transaction(TASKBASE_STORE, 'readwrite')
      .objectStore(TASKBASE_STORE)

    // root task delete
    if (event.type === EVENT_DELETE && event.detail?.is_root) {
      const taskKey = taskElement.task.task_id
      const deleteRequest = taskStore.delete(taskKey)

      deleteRequest.onsuccess = () => {
        console.log(`Deleted task ${taskKey}`)
      }

      deleteRequest.onerror = (event) => {
        console.error(event.target.error)
      }
      // bubbles up to task view
      return
    }

    // event details
    const eventType = event.type
    const task = event.detail.task
    // when deleting a subtask, grab the parent
    if (event.type === EVENT_DELETE) {
      taskElement = event.target.parentElement
    }

    // grab root task
    let rootElement = taskElement
    if (event.target.task.task_path.length > 1) {
      for (let i = 0; i < event.target.task.task_path.length - 1; i++) {
        rootElement = rootElement.parentElement
      }
    }

    const rootTask = rootElement.task
    const putRequest = taskStore.put(rootTask, rootTask.task_id)

    putRequest.onsuccess = (event) => {
      console.log(`Updated task ${event.target.result}`)
      if (eventType === EVENT_EXPAND) {
        // does not need a render
        return
      }
      this.dispatchEvent(
        new CustomEvent(EVENT_RENDER, {
          bubbles: true,
          detail: {
            taskElement,
            task,
          },
        })
      )
    }

    putRequest.onerror = (event) => {
      console.error(event.target.error)
    }
  }

  load() {
    console.log('Loading tasks...')

    const taskStore = this.taskbase.transaction(TASKBASE_STORE).objectStore(TASKBASE_STORE)

    taskStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result

      if (!cursor) {
        return console.log('Tasks loading complete.')
      }

      this.dispatchEvent(
        new CustomEvent(EVENT_RENDER, {
          bubbles: true,
          detail: {
            task: cursor.value,
            is_root: true,
          },
        })
      )

      cursor.continue()
    }
  }

  addRoot() {
    const task = structuredClone(NEW_TASK)
    const taskStore = this.taskbase
      .transaction(TASKBASE_STORE, 'readwrite')
      .objectStore(TASKBASE_STORE)

    const addRequest = taskStore.add(task)

    addRequest.onsuccess = (event) => {
      const taskId = event.target.result

      task.task_id = taskId
      // another request to save the DB key in task_id
      const updateKeyRequest = taskStore.put(task, task.task_id)

      updateKeyRequest.onsuccess = (event) => {
        console.log(`Added task ${taskId}`)
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER, {
            bubbles: true,
            detail: {
              task,
              is_root: true,
            },
          })
        )
      }

      updateKeyRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    addRequest.onerror = (event) => {
      console.error(event.target.error)
    }
  }
}
