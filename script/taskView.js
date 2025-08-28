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

    this.movingNode = null
    this.underNode = null
    this.placement = null
    this.mouseY = null

    this.addEventListener('dragstart', (e) => {
      this.movingNode = e.target
      e.target.classList.add('dragging')
    })

    this.addEventListener('dragend', (e) => {
      // dropping it on itself
      if (this.movingNode === this.underNode) {
        return
      }

      // dropping a branch on task-base to become root
      if (!this.underNode && !this.movingNode.isRoot()) {
        // TODO: detect the Y coord and which node is closest to get its order from its path
        // then use that to create a new path so that it gets rendered in the right order
        const newPath = [0]
        // create root task
        this.querySelector('task-base').addRoot({
          detail: { task: this.movingNode.graftTask(newPath) },
        })
        // cleanup
        this.movingNode.delete()
        this.movingNode = null
        return
      }

      // assign style classes to the task-name (instead of task-node)
      // restricts the visual effects to the task name
      const underTag = this.underNode.querySelector('span')
      // dropping below another node makes it its next sibling
      // dropping it above another node makes it its previous sibling
      if (this.placement === 'above' || this.placement === 'below') {
        const underParent = this.underNode.parentElement
        const underPosition = this.underNode.task.path[this.underNode.task.path.length - 1]

        // update dragging item path
        const newPosition = this.placement === 'above' ? underPosition : underPosition + 1
        // const taskCopy = this.movingNode.graftTask([...underParent.task.path, newPosition])
        // if (taskCopy.id) {
        //   delete taskCopy.id
        // }
        // underParent.task.tree.splice(newPosition, 0, taskCopy)

        underParent.graftNode(this.movingNode, newPosition)
        // save and delete
        underParent.save()
        this.movingNode.delete()
        // cleanup
        this.underNode.classList.remove('over')
        this.underNode.querySelector('span').classList.remove('drag-below')
      }

      // dropping on top of another task makes it its child
      if (this.placement === 'center') {
        // update dragging item path
        // const taskCopy = this.movingNode.graftTask([
        //   ...this.underNode.task.path,
        //   this.underNode.task.tree.length,
        // ])

        // if (taskCopy.id) {
        //   delete taskCopy.id
        // }
        // this.underNode.task.tree.push(taskCopy)

        // open the destination node, save and delete
        this.underNode.task.meta.opened = true
        this.underNode.graftNode(this.movingNode)
        this.underNode.save()
        this.movingNode.delete()
      }

      // cleanup classes and empty cache
      this.underNode.classList.remove('over')
      this.underNode.querySelector('span').classList.remove('drag-center')
      this.movingNode = null
      this.underNode = null
      this.placement = null
    })

    // drag over

    this.addEventListener('dragover', (e) => {
      e.preventDefault()

      // dragging over task-base (empty space)
      if (e.target.tagName === TAG_BASE.toUpperCase()) {
        this.underNode?.classList.remove('over')
        this.underNode = null
        return
      }

      let node = null
      // when the under node is task-node
      if (e.target.tagName === TAG_NODE.toUpperCase()) {
        node = e.target
      }
      // when the under node is  task-name, get the task-node
      if (e.target.getAttribute('slot') === NAME_NAME) {
        node = e.target.parentElement
      }
      // when the under node is not the node being dragged
      if (node && !this.movingNode.equals(node) && this.underNode !== node) {
        // remove previous under node class
        if (this.underNode) {
          this.underNode.classList.remove('over')
        }
        // cache the under node
        this.underNode = node
        this.underNode.classList.add('over')
      }

      // cache mouse vertical movement
      if (!this.mouseY || this.mouseY !== e.clientY) {
        this.mouseY = e.clientY
      }

      if (!this.underNode) {
        return
      }
      // get bounding boxes of dragging node and unerneath node
      const underTag = this.underNode.querySelector('span')
      const movingTag = this.movingNode.querySelector('span')
      const underBox = underTag.getBoundingClientRect()
      const movingBox = movingTag.getBoundingClientRect()
      // const isSameLevel = this.movingNode.parentElement === this.draggingOverItem.parentElement

      // when the dragging node is above the under node
      if (this.mouseY < underBox.top + movingBox.height && this.mouseY > underBox.top) {
        this.placement = 'above'
        underTag.classList.remove('drag-center')
        underTag.classList.remove('drag-below')
        underTag.classList.add('drag-above')
        return
      }

      // when the dragging node is below the under node
      if (this.mouseY > underBox.bottom - movingBox.height && this.mouseY < underBox.bottom) {
        this.placement = 'below'
        underTag.classList.remove('drag-above')
        underTag.classList.remove('drag-center')
        underTag.classList.add('drag-below')
        return
      }

      // when the dragging node overlaps with under node
      if (
        this.mouseY > underBox.top + movingBox.height &&
        this.mouseY < underBox.bottom - movingBox.height
      ) {
        this.placement = 'center'
        underTag.classList.remove('drag-above')
        underTag.classList.remove('drag-below')
        underTag.classList.add('drag-center')
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
