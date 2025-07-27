class TaskElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).appendChild(
      document.getElementById(ID_TEMPLATE).content.cloneNode(true)
    )

    // edit event for task fields
    this.shadowRoot.querySelectorAll(QUERY_SLOT_FIELD).forEach((slot) => {
      const editButton = slot.parentElement.querySelector(QUERY_BUTTON_EDIT)
      editButton.addEventListener('click', this.edit.bind(this))
    })

    // update fields with new input
    this.addEventListener(EVENT_UPDATE, this.update.bind(this))

    // add event for subtasks
    this.shadowRoot.querySelector(QUERY_BUTTON_ADD).addEventListener('click', (event) => {
      // click event only relevant to triggering task
      event.stopPropagation()

      // create new task and add path
      const newTask = structuredClone(NEW_TASK)
      newTask.task_path = [...this.task.task_path, this.task.task_subs.length]
      this.task.task_subs.push(newTask)

      // open drawer
      this.task.task_ui.is_open = true

      this.dispatchEvent(
        new CustomEvent(EVENT_BRANCH, {
          bubbles: true,
          detail: {
            task: this.task,
          },
        })
      )
    })
    //TODO: add a way to undo with ctrl+z, add a history data struct in taskbase, and send opposite command (delete -> add)
    this.shadowRoot.querySelector(QUERY_BUTTON_DELETE).addEventListener('click', (event) => {
      // click event only relevant to triggering task
      event.stopPropagation()

      // root task delete
      if (this.parentElement.tagName === TASKBASE_ELEMENT.toUpperCase()) {
        return this.dispatchEvent(
          new CustomEvent(EVENT_DELETE, {
            bubbles: true,
            detail: { is_root: true },
          })
        )
      }

      // since we are deleting this task, get parent task
      const parentTask = this.parentElement.task
      for (const index in parentTask.task_subs) {
        if (parentTask.task_subs[index].task_path.join('') === this.task.task_path.join('')) {
          parentTask.task_subs.splice(index, 1)
          break
        }
      }

      // dispatch parent taks to render
      this.dispatchEvent(
        new CustomEvent(EVENT_DELETE, {
          bubbles: true,
          detail: {
            task: parentTask,
          },
        })
      )
    })

    // open and close subtasks drawer
    this.shadowRoot.querySelector(QUERY_SUBS_HEADER).addEventListener('click', (event) => {
      // only affects this task
      event.stopPropagation()
      // get the details tag, somehow null open attribute means it is open
      const isOpen = event.currentTarget.parentElement.parentElement.getAttribute('open') === null
      this.task.task_ui.is_open = isOpen
      // stops bubblng at taskbase
      this.dispatchEvent(
        new CustomEvent(EVENT_EXPAND, {
          bubbles: true,
          detail: {
            task: this.task,
          },
        })
      )
    })
  }

  commit(event) {
    event.stopPropagation()

    const saveButton = event.currentTarget
    const taskElement = saveButton.parentElement
    const deleteButton = taskElement.querySelector(QUERY_BUTTON_DELETE)

    const slotName = taskElement.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')

    const input = taskElement.querySelector('input')
    const updateValue = input.value

    this.task[fieldName] = updateValue

    const editButton = taskElement.querySelector(QUERY_BUTTON_EDIT)
    taskElement.removeChild(input)
    taskElement.querySelector('slot').setAttribute('class', '')
    editButton.setAttribute('class', '')
    deleteButton?.setAttribute('class', '')
    saveButton.remove()

    this.dispatchEvent(
      new CustomEvent(EVENT_UPDATE, {
        bubbles: true,
        detail: { task: this.task },
      })
    )
  }

  edit(event) {
    event.stopPropagation()

    const editButton = event.currentTarget
    const taskElement = editButton.parentElement
    const deleteButton = taskElement.querySelector(QUERY_BUTTON_DELETE)

    const slotName = taskElement.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')

    if (taskElement.getElementsByTagName('input')?.length) return

    editButton.setAttribute('class', 'hidden')
    deleteButton?.setAttribute('class', 'hidden')
    taskElement.querySelector('slot').setAttribute('class', 'hidden')

    const inputElement = document.createElement('input')
    inputElement.setAttribute('type', 'text')
    inputElement.setAttribute('id', `${slotName}-${this.task.task_path.join('')}`)
    inputElement.setAttribute('value', this.task[fieldName])

    const saveButton = document.createElement('button')
    saveButton.textContent = LABEL_BUTTON_SAVE
    saveButton.setAttribute('name', 'task-save')
    // bind commit on save click
    saveButton.addEventListener('click', this.commit.bind(this))

    taskElement.prepend(inputElement)
    taskElement.prepend(saveButton)

    inputElement.addEventListener('keyup', ({ key }) => {
      if (key === 'Enter') saveButton.click()
    })

    inputElement.focus()
  }

  update(event) {
    const shadow = event.currentTarget.shadowRoot
    const slotName = shadow.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')
    const elementQuery = `${ELEMENT_TASK_FIELD}[slot="${slotName}"]`
    const taskPath = event.detail.task.task_path.join('')
    const updateValue = event.detail.task[fieldName]

    if (taskPath === this.task.task_path.join('')) {
      event.currentTarget.querySelector(elementQuery).textContent = updateValue
    }
  }
}
