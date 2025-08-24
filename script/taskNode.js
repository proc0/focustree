class TaskNode extends HTMLElement {
  constructor() {
    super()
  }

  init(task) {
    this.task = task
    this.equals.bind(this)
    this.dispatch.bind(this)

    this.attachShadow({ mode: 'open' }).appendChild(
      document
        .getElementById(task.meta.editing ? TEMPLATE_EDIT : TEMPLATE_NODE)
        .content.cloneNode(true)
    )

    if (task.meta.editing) {
      // task fields edit
      this.selectAll(NAME_EDIT).forEach((editButton) => {
        editButton.addEventListener('click', this.edit.bind(this))
      })
      // task edit save
      this.selectName(NAME_SAVE).addEventListener('click', (event) => {
        event.stopPropagation()
        this.task.meta.editing = false
        this.dispatch(EVENT_EDIT)
      })
    } else {
      // prevent menu click from triggering subtask open
      this.selectName(NAME_MENU).addEventListener('click', (event) => {
        event.stopPropagation()
        this.dispatch(EVENT_MENU)
      })
      // // task edit mode
      // this.selectName(NAME_EDIT).addEventListener('click', (event) => {
      //   event.stopPropagation()
      //   this.task.meta.editing = true
      //   this.dispatch(EVENT_EDIT)
      // })
    }

    // update fields with new input
    this.addEventListener(EVENT_UPDATE, this.update.bind(this))

    // // add event for subtasks
    // this.selectName(NAME_ADD).addEventListener('click', (event) => {
    //   event.stopPropagation()
    //   this.dispatch(EVENT_BRANCH)
    // })

    // //TODO: add a way to undo with ctrl+z, add a history data struct
    // // in taskBase, and send opposite command (delete -> add)
    // this.selectName(NAME_DELETE).addEventListener('click', (event) => {
    //   event.stopPropagation()
    //   // root task delete
    //   if (this.isRoot()) {
    //     return this.dispatch(EVENT_DELETE)
    //   }

    //   // since we are deleting this task, get parent task
    //   const parentTask = this.parentElement.task
    //   for (const index in parentTask.tree) {
    //     if (parentTask.tree[index].path.join('') === this.task.path.join('')) {
    //       parentTask.tree.splice(index, 1)
    //       break
    //     }
    //   }

    //   // dispatch parent task to render
    //   this.dispatch(EVENT_DELETE, parentTask)
    // })

    // this.selectName(NAME_FOCUS).addEventListener('click', (event) => {
    //   event.stopPropagation()
    //   this.dispatch(EVENT_FOCUS)
    // })

    // // prevent select or option click from triggering subtask open
    // this.selectName(NAME_STATE).addEventListener('click', (event) => {
    //   event.stopPropagation()
    // })
    // // task state selection
    // this.selectName(NAME_STATE).addEventListener('change', (event) => {
    //   event.stopPropagation()
    //   this.task.state = Number(event.target.value)
    //   this.dispatch(EVENT_STATUS)
    // })

    // // sync task tree states
    // this.selectName(NAME_SYNC).addEventListener('click', (event) => {
    //   event.stopPropagation()
    //   this.dispatch(EVENT_SYNC)
    // })

    // open and close subtasks drawer
    this.select('details summary').addEventListener('click', (event) => {
      event.stopPropagation()
      // get the details tag, somehow null open attribute means it is open
      const opened = event.currentTarget.parentElement.getAttribute('open') === null
      this.task.meta.opened = opened
      this.dispatch(EVENT_EXPAND)
    })
  }

  blurTask(state) {
    if (state) {
      this.task.state = state
      // complete the history entry
      const lastIndex = this.task.data.record.length - 1
      this.task.data.record[lastIndex].stateEnd = state
      this.task.data.record[lastIndex].timeEnd = Date.now()
    }
    this.task.meta.focused = false
    this.dispatch(EVENT_STATUS)
  }

  commit(event) {
    event.stopPropagation()
    // current button is save
    const { fieldName, currentButton, deleteButton, taskField } = this.getFieldElements(event)
    const input = taskField.querySelector('input')
    const editButton = taskField.querySelector(`[name="${NAME_EDIT}"]`)
    // show hidden elements again
    taskField.removeChild(input)
    taskField.querySelector('slot').setAttribute('class', '')
    editButton.setAttribute('class', '')
    deleteButton?.setAttribute('class', '')
    // remove save button
    currentButton.remove()

    // no changes
    if (!input.value || input.value === this.task[fieldName]) {
      return
    }

    // update task
    const updateValue = input.value
    this.task[fieldName] = updateValue

    this.dispatch(EVENT_UPDATE)
  }

  dispatch(eventName, task = this.task) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        detail: { task, node: this },
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
    input.setAttribute('id', `${slotName}-${this.task.path.join('')}`)
    input.setAttribute('value', this.task[fieldName])
    // spawn a save button
    const saveButton = document.createElement('button')
    const taskSaveButton = this.selectName(NAME_SAVE)
    saveButton.textContent = taskSaveButton.textContent
    saveButton.setAttribute('name', NAME_SAVE)
    // bind commit on save click
    saveButton.addEventListener('click', this.commit.bind(this))

    taskField.prepend(input)
    taskField.prepend(saveButton)

    input.addEventListener('keyup', ({ key }) => {
      if (key === 'Enter') saveButton.click()
    })

    input.focus()
  }

  equals(node) {
    return node.task && this.task.path.toString() === node.task.path.toString()
  }

  focusTask() {
    this.task.state = 1
    this.task.meta.focused = true
    this.task.meta.opened = true
    // add history entry
    this.task.data.record.push({
      stateStart: this.task.state,
      timeStart: Date.now(),
    })
    // set task state
    this.dispatch(EVENT_STATUS, this.task)
    // custom scroll into view, places the focused task slightly above center
    const taskContainer = this.select('div').getBoundingClientRect()
    const containerY = taskContainer.top + window.pageYOffset
    const middle = containerY - window.innerHeight / 2 + 200
    window.scrollTo(0, middle)
  }

  isRoot() {
    return this.parentElement.tagName === TAG_BASE.toUpperCase()
  }

  getFieldNames(element) {
    const slotName = element.querySelector('slot').getAttribute('name')
    const fieldName = slotName.split('-')[1]

    return { slotName, fieldName }
  }

  getFieldElements(event) {
    const currentButton = event.currentTarget
    const taskField = currentButton.parentElement
    const { slotName, fieldName } = this.getFieldNames(taskField)
    const deleteButton = taskField.querySelector(`[name="${NAME_DELETE}"]`)

    return { slotName, fieldName, currentButton, deleteButton, taskField }
  }

  select(query) {
    return this.shadowRoot.querySelector(query)
  }

  selectName(name) {
    return this.shadowRoot.querySelector(`[name="${name}"]`)
  }

  selectAll(name) {
    return this.shadowRoot.querySelectorAll(`[name="${name}"]`)
  }

  update(event) {
    const fieldElement = event.currentTarget.shadowRoot
    const { slotName, fieldName } = this.getFieldNames(fieldElement)

    const elementQuery = `${TAG_FIELD}[slot="${slotName}"]`
    const taskPath = event.detail.task.path.join('')
    const updateValue = event.detail.task[fieldName]

    // only update relevant task as this bubbles up to task-view
    if (taskPath === this.task.path.join('')) {
      event.currentTarget.querySelector(elementQuery).textContent = updateValue
    }
  }
}
