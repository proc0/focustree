const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const QUERY_FOCUS_NODE = 'task-node[data-focused]'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.deleteTree.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focusTree.bind(this))
    this.addEventListener(EVENT_EDIT, this.render.bind(this))
    this.addEventListener(EVENT_MENU, this.showMenu.bind(this))
    this.addEventListener(EVENT_EXPAND, this.hideMenu.bind(this))

    // dragging

    this.draggingItem = null
    this.draggingOverItem = null
    this.placement = null

    this.addEventListener('dragstart', (e) => {
      this.draggingItem = e.target
      e.target.classList.add('dragging')
    })

    this.addEventListener('dragend', (e) => {
      if (this.draggingItem === this.draggingOverItem) {
        return
      }
      if (!this.draggingOverItem && !this.draggingItem.isRoot()) {
        this.querySelector('task-base').addRoot({ detail: { task: this.draggingItem.graft([0]) } })
        this.draggingItem.delete()
        this.draggingItem = null
        return
      }

      if (this.placement === 'above') {
        console.log('above', this.draggingOverItem)
      }

      if (this.placement === 'below') {
        console.log('below', this.draggingOverItem)
      }

      if (this.placement === 'within') {
        // update draggin item path
        const taskCopy = this.draggingItem.graft([
          ...this.draggingOverItem.task.path,
          this.draggingOverItem.task.tree.length,
        ])

        if (taskCopy.id) {
          delete taskCopy.id
        }

        // this.draggingItem.classList.remove('dragging')
        // this.draggingOverItem.classList.remove('over')
        this.draggingOverItem.task.meta.opened = true
        this.draggingOverItem.task.tree.push(taskCopy)
        this.draggingOverItem.save()
        this.draggingItem.delete()
      }

      this.draggingOverItem.classList.remove('over')
      this.draggingItem = null
      this.draggingOverItem = null
    })

    this.addEventListener('dragover', (e) => {
      e.preventDefault()

      if (e.target.tagName === TAG_BASE.toUpperCase()) {
        this.draggingOverItem?.classList.remove('over')
        this.draggingOverItem = null
        return
      }

      let node = null

      if (e.target.tagName === TAG_NODE.toUpperCase()) {
        node = e.target
      }
      if (e.target.getAttribute('slot') === NAME_NAME) {
        node = e.target.parentElement
      }

      if (!this.draggingItem.equals(node) && this.draggingOverItem !== node) {
        if (this.draggingOverItem) {
          this.draggingOverItem.classList.remove('over')
        }
        this.draggingOverItem = node

        this.draggingOverItem.classList.add('over')

        // console.log(this.draggingItem.getBoundingClientRect().y)
      }

      const draggingOverBox = this.draggingOverItem?.querySelector('span').getBoundingClientRect()
      const draggingBox = this.draggingItem?.querySelector('span').getBoundingClientRect()
      // const isSameLevel = this.draggingItem.parentElement === this.draggingOverItem.parentElement
      const dragBuffer = 5
      console.log(
        e.clientY,
        draggingOverBox?.top + draggingBox?.height - dragBuffer,
        draggingOverBox?.bottom - draggingBox?.height + dragBuffer
      )
      //if dragging item is above the dragging over item

      if (
        this.draggingOverItem &&
        e.clientY < draggingOverBox.top + draggingBox.height &&
        e.clientY > draggingOverBox.top
      ) {
        // this.draggingOverItem?.classList.remove('over')
        this.placement = 'above'
        return
        // this.draggingOverItem.task.tree.unshift(this.draggingItem.task)
      }

      //if dragging item is below the dragging over item
      if (
        this.draggingOverItem &&
        e.clientY > draggingOverBox.bottom - draggingBox.height &&
        e.clientY < draggingOverBox.bottom
      ) {
        // this.draggingOverItem?.classList.remove('over')
        this.placement = 'below'
        return
        // this.draggingOverItem.task.tree.push(this.draggingItem.task)
      }

      if (
        draggingOverBox &&
        e.clientY > draggingOverBox.top + draggingBox.height - dragBuffer &&
        e.clientY < draggingOverBox.bottom - draggingBox.height + dragBuffer
      ) {
        this.placement = 'within'
        return
      }
    })
  }

  deleteTree({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focusTree(event) {
    const initialTask = event.target
    // focus initial task
    initialTask.focus()
    // show focus modal
    this.querySelector('dialog').showFocus(initialTask)
    // custom scroll into view, places the focused task slightly above center
    const taskContainer = initialTask.select('div').getBoundingClientRect()
    const containerY = taskContainer.top + window.pageYOffset
    const middle = containerY - window.innerHeight / 2 + 200
    window.scrollTo(0, middle)
  }

  getNode(task) {
    if (!task) {
      // if no task, return the focused task
      return this.querySelector(QUERY_FOCUS_NODE)
    }

    const taskId = task.id
    const taskPath = task.path.toString()

    let node = null
    if (taskId) {
      node = this.querySelector(`task-node[data-id="${taskId}"]`)
    } else {
      node = this.querySelector(`task-node[data-path="${taskPath}"]`)
    }

    return node
  }

  hideMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').hide()
  }

  render({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)

    // task base events without node are to be appended directly
    // TODO?: find an abstraction to consolidate this logic
    if (task.id && !detail?.node && target.tagName === TAG_BASE.toUpperCase()) {
      // append root tasks to task-base
      target.appendChild(treeNode)
      // TODO: scroll adding root into view (requires more info from event?)
      // scenario: there is a lot of tasks and you add a new one, it should scroll into view
      // return treeNode.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // branching subtask
    treeNode.setAttribute('slot', NAME_TREE)
    // replace node with updated node
    detail.node.replaceWith(treeNode)
  }

  renderSelect(task) {
    const taskState = document.createElement('select')
    taskState.setAttribute('slot', NAME_STATE)
    // let currentState = ''
    task.data.states.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state.toUpperCase()
      // set current state
      if (index === task.state) {
        // currentState = state
        option.setAttribute('selected', '')
        taskState.value = index
      }
      taskState.appendChild(option)
    })
    // set class to current state name
    // taskState.classList.add(currentState)
    return taskState
  }

  renderTree(task) {
    const taskNode = document.createElement(TAG_NODE).init(task)
    const container = taskNode.shadowRoot.querySelector('div')

    // metadata
    taskNode.setAttribute('data-path', task.path)
    if (task.id) {
      // only root tasks have id
      taskNode.setAttribute('data-id', task.id)
    }
    taskNode.setAttribute('draggable', 'true')

    // fields
    if (taskNode.selectName(NAME_NAME)) {
      const taskName = document.createElement(TAG_FIELD)
      taskName.setAttribute('slot', NAME_NAME)
      const treeLength = task.tree.length
      if (task.meta.editing || !treeLength) {
        taskName.textContent = task.name
      } else {
        taskName.textContent = `${task.name} (${treeLength})`
        if (task.note.length) {
          taskName.setAttribute('title', task.note)
        }
      }
      taskNode.appendChild(taskName)
    }

    if (task.meta.editing) {
      if (task.note.length) {
        const taskNote = document.createElement(TAG_FIELD)
        taskNote.setAttribute('slot', NAME_NOTE)
        taskNote.textContent = task.note
        taskNode.appendChild(taskNote)
      }
      const taskState = this.renderSelect(task, taskNode)
      taskNode.appendChild(taskState)
      // add edit class
      container.classList.add('editing')
    }

    // state class and attributes on container
    const currentState = task.data.states[task.state].toLowerCase()
    container.classList.add(currentState)

    if (task.meta.focused) {
      taskNode.setAttribute('data-focused', '')
      container.classList.add('focused')
    }

    // refresh menu task node
    const menu = this.querySelector('menu')
    if (menu.node?.equals(taskNode)) {
      menu.node = taskNode
    }

    // leaf node
    if (!task.tree.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch node
    container.classList.add(CLASS_BRANCH)

    const treeTitleSlot = taskNode.selectName(NAME_TITLE_TREE)
    if (treeTitleSlot && task.meta.editing) {
      const treeLabel = document.createElement(TAG_LABEL)
      const treeLength = task.tree.length
      treeLabel.setAttribute('slot', NAME_TITLE_TREE)
      treeLabel.textContent = `${treeTitleSlot.getAttribute('data-text')} (${treeLength})`
      taskNode.appendChild(treeLabel)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    for (const sub in task.tree) {
      const subTask = this.renderTree(task.tree[sub])
      subTask.setAttribute('slot', NAME_TREE)

      taskNode.appendChild(subTask)
    }

    return taskNode
  }

  showMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').show(event)
  }
}
