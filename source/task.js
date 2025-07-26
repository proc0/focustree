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
    // TODO: move this to a method, remove event details and derive from event, event should only have detail.task
    this.addEventListener(EVENT_UPDATE, (event) => {
      if (event.detail.taskPath === this.task.task_path.join('')) {
        event.currentTarget.querySelector(event.detail.elementQuery).textContent =
          event.detail.updateValue
      }
    })
    // add event for subtasks
    this.shadowRoot.querySelector(QUERY_BUTTON_ADD).addEventListener('click', () => {
      const newTask = structuredClone(NEW_TASK)
      newTask.task_path = [...this.task.task_path, this.task.task_subs.length]

      this.task.task_subs.push(newTask)
      this.task.task_ui.is_open = true

      // const updatedTaskElement = renderTaskTree(this.task)
      // updatedTaskElement.setAttribute('slot', 'task-subs')
      // updatedTaskElement.shadowRoot.querySelector('details').setAttribute('open', '')

      this.dispatchEvent(
        new CustomEvent(EVENT_BRANCH, {
          bubbles: true,
          detail: {
            task: this.task,
          },
        })
      )

      // this.parentElement.replaceChild(updatedTaskElement, this)
    })
    //TODO: add a way to undo with ctrl+z, tombstone and hide instead? needs the data processing layer
    this.shadowRoot.querySelector(QUERY_BUTTON_DELETE).addEventListener('click', () => {
      if (this.parentElement.tagName === TASK_BASE_ELEMENT.toUpperCase()) {
        return this.dispatchEvent(
          new CustomEvent(EVENT_DELETE, {
            bubbles: true,
            detail: { is_root: true },
          })
        )
      }

      const parentTask = this.parentElement.task
      for (const index in parentTask.task_subs) {
        if (parentTask.task_subs[index].task_path.join('') === this.task.task_path.join('')) {
          parentTask.task_subs.splice(index, 1)
          break
        }
      }

      // const updatedTaskElement = renderTaskTree(parentTask)
      // updatedTaskElement.setAttribute('slot', 'task-subs')

      this.dispatchEvent(
        new CustomEvent(EVENT_DELETE, {
          bubbles: true,
          detail: {
            task: parentTask,
          },
        })
      )
      // this promotes the task to the parent task...
      // this.parentElement.replaceWith(updatedTaskElement, this)
      // this.parentElement.replaceWith(updatedTaskElement)
    })
    // record open state
    this.shadowRoot.querySelector('details summary').addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON') {
        // add event handles this case
        return
      }
      const isOpen = !!event.currentTarget.getAttribute('open')
      this.task.task_ui.is_open = this.task.task_ui.is_open ? isOpen : !isOpen

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
    const saveButton = event.currentTarget
    const parent = saveButton.parentElement
    const deleteButton = parent.querySelector(QUERY_BUTTON_DELETE)

    const slotName = parent.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')

    const input = parent.querySelector('input')
    const updateValue = input.value

    this.task[fieldName] = updateValue
    const elementQuery = `${ELEMENT_TASK_FIELD}[slot="${slotName}"]`
    const taskPath = this.task.task_path.join('')

    const editButton = parent.querySelector(QUERY_BUTTON_EDIT)
    parent.removeChild(input)
    parent.querySelector('slot').setAttribute('class', '')
    editButton.setAttribute('class', '')
    deleteButton?.setAttribute('class', '')
    saveButton.remove()

    this.dispatchEvent(
      new CustomEvent(EVENT_UPDATE, {
        bubbles: true,
        detail: { updateValue, elementQuery, taskPath, task: this.task },
      })
    )
  }

  edit(event) {
    const editButton = event.currentTarget
    const parent = editButton.parentElement
    const deleteButton = parent.querySelector(QUERY_BUTTON_DELETE)

    const slotName = parent.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')

    if (parent.getElementsByTagName('input')?.length) return

    editButton.setAttribute('class', 'hidden')
    deleteButton?.setAttribute('class', 'hidden')
    parent.querySelector('slot').setAttribute('class', 'hidden')

    const inputElement = document.createElement('input')
    inputElement.setAttribute('type', 'text')
    inputElement.setAttribute('id', `${slotName}-${this.task.task_path.join('')}`)
    inputElement.setAttribute('value', this.task[fieldName])

    const saveButton = document.createElement('button')
    saveButton.textContent = LABEL_BUTTON_SAVE
    saveButton.setAttribute('name', 'task-save')
    // bind commit on save click
    saveButton.addEventListener('click', this.commit.bind(this))

    parent.prepend(inputElement)
    parent.prepend(saveButton)

    inputElement.addEventListener('keyup', ({ key }) => {
      if (key === 'Enter') saveButton.click()
    })

    inputElement.focus()
  }
}
