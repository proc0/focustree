class TaskNode extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.bindEvents()
  }

  bindEvents() {
    // open and close subtasks drawer
    this.select('details summary').addEventListener('click', (event) => {
      event.stopPropagation()
      // get the details tag, somehow null open attribute means it is open
      const opened = event.currentTarget.parentElement.getAttribute('open') === null
      this.task.meta.opened = opened
      this.dispatch(EVENT_EXPAND)
    })

    if (!this.task.meta.editing) {
      // task menu
      return this.selectName(NAME_MENU).addEventListener('click', (event) => {
        event.stopPropagation()
        this.dispatch(EVENT_MENU)
      })
    }

    this.selectName(NAME_FOCUS).addEventListener('click', (event) => {
      event.stopPropagation()
      this.dispatch(EVENT_FOCUS)
    })

    this.selectName(NAME_ADD).addEventListener('click', (event) => {
      event.stopPropagation()
      this.dispatch(EVENT_BRANCH)
    })

    // task fields edit
    this.selectNames(NAME_EDIT).forEach((editButton) => {
      editButton.addEventListener('click', this.edit.bind(this))
    })

    // update after editing fields
    this.addEventListener(EVENT_UPDATE, this.updateField.bind(this))

    // task edit save
    this.selectName(NAME_SAVE).addEventListener('click', (event) => {
      event.stopPropagation()
      this.task.meta.editing = false
      this.dispatch(EVENT_EDIT)
    })

    // task delete
    this.selectName(NAME_DELETE).addEventListener('click', (event) => {
      event.stopPropagation()
      this.delete()
    })

    // task state selection
    this.selectName(NAME_STATE).addEventListener('change', (event) => {
      event.stopPropagation()
      this.changeState(Number(event.target.value))
    })
  }

  blur() {
    this.task.meta.focused = false
    this.dispatch(EVENT_STATUS)
  }

  changeState(state) {
    const lastRecord = this.task.data.record.length - 1
    // add history entry
    if (lastRecord) {
      if (this.task.data.record[lastRecord]?.stateEnd) {
        // complete entry
        this.task.data.record[lastRecord].stateEnd = state
        this.task.data.record[lastRecord].timeEnd = Date.now()
      } else {
        // new entry
        this.task.data.record.push({
          stateStart: this.task.state,
          timeStart: Date.now(),
        })
      }
    }

    this.task.state = state
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
    taskField.querySelector('slot').removeAttribute('disabled')
    editButton.removeAttribute('disabled')
    deleteButton?.removeAttribute('disabled')
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

  complete() {
    this.task.meta.focused = false
    this.changeState(3)
  }

  delete() {
    if (this.isRoot()) {
      // root is removed by task base
      return this.dispatch(EVENT_DELETE)
    }
    // delet self using parent
    this.parentElement.deleteSub(this.task)
    // update path indices
    this.parentElement.updateSubPaths()
    // dispatch parent task to save and render
    this.dispatch(EVENT_DELETE, this.parentElement.task)
  }

  deleteSub(task) {
    for (let i = 0; i < this.task.tree.length; i++) {
      if (this.task.tree[i].path.join('') === task.path.join('')) {
        this.task.tree.splice(i, 1)
        break
      }
    }
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
    currentButton.setAttribute('disabled', '')
    deleteButton?.setAttribute('disabled', '')
    taskField.querySelector('slot').setAttribute('disabled', '')
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

  editMode() {
    this.task.meta.editing = true
    this.dispatch(EVENT_EDIT)
  }

  equals(node) {
    return (
      node?.task &&
      this.task.path.toString() === node.task.path.toString() &&
      this.task.id === node.task.id
    )
  }

  focus() {
    this.task.meta.focused = true
    this.task.meta.opened = true
    // set state active
    this.changeState(1)
  }

  init(task) {
    this.task = task

    const template = task.meta.editing ? TEMPLATE_EDIT : TEMPLATE_NODE
    this.attachShadow({ mode: 'open' }).appendChild(
      document.getElementById(template).content.cloneNode(true)
    )

    return this
  }

  isActive() {
    return this.task.state === 1
  }

  // is node an ancestor node
  isAncestor(node) {
    if (this.isRoot()) {
      return false
    }

    let result = false
    let ancestor = this.parentElement
    if (ancestor.equals(node)) {
      result = true
    }
    while (!ancestor.isRoot()) {
      ancestor = ancestor.parentElement
      if (ancestor.equals(node)) {
        result = true
        break
      }
    }

    return result
  }

  isRoot() {
    return this.parentElement.tagName === TAG_BASE.toUpperCase()
  }

  getFieldNames(element) {
    const slotName = element.querySelector('slot').getAttribute('name')
    const fieldName = slotName.split('-')[1]

    return { slotName, fieldName }
  }

  getFieldElements({ currentTarget }) {
    // assumes button element is next to field element
    const currentButton = currentTarget
    const taskField = currentTarget.parentElement
    const { slotName, fieldName } = this.getFieldNames(taskField)
    const deleteButton = taskField.querySelector(`[name="${NAME_DELETE}"]`)

    return { slotName, fieldName, currentButton, deleteButton, taskField }
  }

  getRootNode() {
    if (this.isRoot()) {
      return this
    }
    let root = this
    while (!root.isRoot()) {
      root = root.parentElement
    }
    return root
  }

  graftNode(node, position = this.task.tree.length) {
    // get grafted branch from input node
    const graft = node.graftTask([...this.task.path, position])
    // insert graft at position
    this.task.tree.splice(position, 0, graft)
  }

  graftTask(path) {
    const graft = structuredClone(this.task)
    if (path) {
      graft.path = path
    }
    // root to branch
    if (graft.id) {
      delete graft.id
    }
    return this.updateTreePaths(graft)
  }

  pause() {
    this.task.meta.focused = false
    this.changeState(2)
  }

  save() {
    this.dispatch(EVENT_SAVE)
  }

  select(query) {
    return this.shadowRoot.querySelector(query)
  }

  selectName(name) {
    return this.shadowRoot.querySelector(`[name="${name}"]`)
  }

  selectNames(name) {
    return this.shadowRoot.querySelectorAll(`[name="${name}"]`)
  }

  updateField({ currentTarget, detail }) {
    const fieldElement = currentTarget.shadowRoot
    const { slotName, fieldName } = this.getFieldNames(fieldElement)

    const elementQuery = `${TAG_FIELD}[slot="${slotName}"]`
    const taskPath = detail.task.path.join('')
    const updateValue = detail.task[fieldName]

    // only update relevant task as this bubbles up to task-view
    if (taskPath === this.task.path.join('')) {
      currentTarget.querySelector(elementQuery).textContent = updateValue
    }
  }

  updateSubPaths() {
    this.task.tree.forEach((sub, index) => {
      sub.path[sub.path.length - 1] = index
    })
  }

  updateTreePaths(_task = this.task) {
    const updatePath = (task) => {
      if (!task.tree.length) return task

      task.tree.forEach((sub, index) => {
        sub.path = [...task.path, index]
        updatePath(sub)
      })

      return task
    }

    return updatePath(_task)
  }
}
