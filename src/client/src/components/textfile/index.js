import { Component } from 'react';
import text from './data.js';

class TextFile extends Component {
  render(){
    return (
      <div>{text}</div>
    )
  }
}

export default TextFile;