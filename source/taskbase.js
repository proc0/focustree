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

  save(event) {
    let rootElement = event.target
    const taskStore = this.taskbase
      .transaction(TASKBASE_STORE, 'readwrite')
      .objectStore(TASKBASE_STORE)

    // root task delete
    if (event.type === EVENT_DELETE && event.detail?.is_root) {
      const taskKey = rootElement.task.task_id
      const deleteRequest = taskStore.delete(taskKey)

      deleteRequest.onsuccess = () => {
        console.log(`Deleted task ${taskKey}`)
      }

      deleteRequest.onerror = (event) => {
        console.error(event.target.error)
      }

      return
    }

    // event details
    const eventType = event.type
    const task = event.detail.task
    let taskElement = event.target
    if (event.type === EVENT_DELETE) {
      taskElement = event.target.parentElement
    }

    // grab root
    for (let i = 0; i < event.target.task.task_path.length - 1; i++) {
      rootElement = rootElement.parentElement
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
        console.log('Tasks loading complete.')
        return
      }

      //   const taskElement = renderTaskTree(cursor.value)
      //   this.appendChild(taskElement)
      this.dispatchEvent(
        new CustomEvent(EVENT_RENDER_ROOT, {
          bubbles: true,
          detail: {
            task: cursor.value,
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

    //TODO: use IndexedDB keypath for task_id instead of correlating task-element length with database ID
    // task.task_id = this.querySelectorAll('task-base > task-element').length + 1
    const addRequest = taskStore.add(task)

    addRequest.onsuccess = (event) => {
      console.log(`Added task ${event.target.result}`)
      task.task_id = event.target.result

      // update with the DB key
      const updateKeyRequest = taskStore.put(task, task.task_id)

      updateKeyRequest.onsuccess = (event) => {
        //   const taskElement = renderTaskTree(task)
        //   this.appendChild(taskElement)
        this.dispatchEvent(
          new CustomEvent(EVENT_RENDER_ROOT, {
            bubbles: true,
            detail: {
              task,
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
