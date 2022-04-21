import { Tag } from 'antd';
import React, { Component } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import styles from './index.module.less';

const reorder = (list: string[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);

  const [removed] = result.splice(startIndex, 1);

  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (_isDragging, draggableStyle) => ({
  ...draggableStyle,
});

interface IProps {
  data: string[];
  updateData: (data: string[]) => void;
  removeData: (field: string) => void;
}

export default class DraggableTags extends Component<IProps> {
  constructor(props) {
    super(props);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd(result) {
    if (!result.destination) {
      return;
    }
    // adjust tag order when drop the element
    const items: string[] = reorder(
      this.props.data,
      result.source.index,
      result.destination.index,
    );
    this.props.updateData(items);
  }

  render() {
    const list = this.props.data.map(item => ({
      id: `field-${item}`,
      content: (
        <Tag className={styles.dragItem} closable={true} onClose={() => this.props.removeData(item)}>
          {item}
        </Tag>
      ),
    }));
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable" direction="horizontal">
          {(provided, _snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                display: 'flex',
                overflow: 'auto',
                flexWrap: 'wrap',
              }}
            >
              {list.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style,
                      )}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
