const QUERY_SLOT_FIELD = 'ul li slot'
const QUERY_SUBS_HEADER = 'details summary header'
const QUERY_BUTTON_ADD = 'button[name="task-add"]'
const QUERY_BUTTON_EDIT = 'button[name="task-edit"]'
const QUERY_BUTTON_DELETE = 'button[name="task-delete"]'

class TaskNode extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).appendChild(
      document.getElementById(TEMPLATE_NODE).content.cloneNode(true)
    )

    // click event for editing task fields
    this.shadowRoot.querySelectorAll(QUERY_SLOT_FIELD).forEach((slot) => {
      const editButton = slot.parentElement.querySelector(QUERY_BUTTON_EDIT)
      editButton.addEventListener('click', this.edit.bind(this))
    })

    // update fields with new input
    this.addEventListener(EVENT_UPDATE, this.update.bind(this))

    // add event for subtasks
    this.shadowRoot.querySelector(QUERY_BUTTON_ADD).addEventListener('click', (event) => {
      event.stopPropagation()
      this.dispatch(EVENT_BRANCH, this.task)
    })

    //TODO: add a way to undo with ctrl+z, add a history data struct in taskBase, and send opposite command (delete -> add)
    this.shadowRoot.querySelector(QUERY_BUTTON_DELETE).addEventListener('click', (event) => {
      event.stopPropagation()

      // root task delete
      if (this.parentElement.tagName === ELEMENT_BASE.toUpperCase()) {
        return this.dispatch(EVENT_DELETE, this.task)
      }

      // since we are deleting this task, get parent task
      const parentTask = this.parentElement.task
      for (const index in parentTask.task_subs) {
        if (parentTask.task_subs[index].task_path.join('') === this.task.task_path.join('')) {
          parentTask.task_subs.splice(index, 1)
          break
        }
      }

      // dispatch parent task to render
      this.dispatch(EVENT_DELETE, parentTask)
    })

    // open and close subtasks drawer
    this.shadowRoot.querySelector(QUERY_SUBS_HEADER).addEventListener('click', (event) => {
      event.stopPropagation()
      // get the details tag, somehow null open attribute means it is open
      const isOpen = event.currentTarget.parentElement.parentElement.getAttribute('open') === null
      this.task.task_ui.is_open = isOpen
      this.dispatch(EVENT_EXPAND, this.task)
    })
  }

  commit(event) {
    event.stopPropagation()

    const { slotName, fieldName, currentButton, deleteButton, taskField } =
      this.getFieldElements(event)

    const input = taskField.querySelector('input')

    // show hidden elements again
    const editButton = taskField.querySelector(QUERY_BUTTON_EDIT)
    taskField.removeChild(input)
    taskField.querySelector('slot').setAttribute('class', '')
    editButton.setAttribute('class', '')
    deleteButton?.setAttribute('class', '')
    // save button
    currentButton.remove()

    // no changes
    if (!input.value || input.value === this.task[fieldName]) {
      return
    }

    // update task
    const updateValue = input.value
    this.task[fieldName] = updateValue

    this.dispatch(EVENT_UPDATE, this.task)
  }

  dispatch(eventName, task) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        detail: { task },
      })
    )
  }

  edit(event) {
    event.stopPropagation()
    // current button is edit
    const { slotName, fieldName, currentButton, deleteButton, taskField } =
      this.getFieldElements(event)

    // return if input is already present
    if (taskField.getElementsByTagName('input')?.length) return

    // hide field elements
    currentButton.setAttribute('class', 'hidden')
    deleteButton?.setAttribute('class', 'hidden')
    taskField.querySelector('slot').setAttribute('class', 'hidden')
    // show input in place of field
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('id', `${slotName}-${this.task.task_path.join('')}`)
    input.setAttribute('value', this.task[fieldName])
    // spawn a save button
    const saveButton = document.createElement('button')
    saveButton.textContent = TEXT_SAVE
    saveButton.setAttribute('name', 'task-save')
    // bind commit on save click
    saveButton.addEventListener('click', this.commit.bind(this))

    taskField.prepend(input)
    taskField.prepend(saveButton)

    input.addEventListener('keyup', ({ key }) => {
      if (key === 'Enter') saveButton.click()
    })

    input.focus()
  }

  getFieldNames(element) {
    const slotName = element.querySelector('slot').getAttribute('name')
    const fieldName = slotName.replace('-', '_')

    return { slotName, fieldName }
  }

  getFieldElements(event) {
    const currentButton = event.currentTarget
    const taskField = currentButton.parentElement
    const { slotName, fieldName } = this.getFieldNames(taskField)
    const deleteButton = taskField.querySelector(QUERY_BUTTON_DELETE)

    return { slotName, fieldName, currentButton, deleteButton, taskField }
  }

  update(event) {
    const fieldElement = event.currentTarget.shadowRoot
    const { slotName, fieldName } = this.getFieldNames(fieldElement)

    const elementQuery = `${ELEMENT_FIELD}[slot="${slotName}"]`
    const taskPath = event.detail.task.task_path.join('')
    const updateValue = event.detail.task[fieldName]

    // only update relevant task as this bubbles up to task-view
    if (taskPath === this.task.task_path.join('')) {
      event.currentTarget.querySelector(elementQuery).textContent = updateValue
    }
  }
}
