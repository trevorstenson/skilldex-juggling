import React,{Component} from 'react'
import cytoscape from 'cytoscape'
import {jugglingLibrary} from './jugglingLibrary.js'
import store from './store'
import Graph from 'vis-react'
import {toJS} from "mobx"

class TrickGraph extends React.Component {
    render() {
      store.nodes
      store.edges
      const nodes = JSON.parse(JSON.stringify(store.nodes))
      const edges = JSON.parse(JSON.stringify(store.edges))
    const data = {
      nodes: nodes,
      edges: edges
    }
    const options = {
      nodes: {borderWidth: 2},
      interaction: {hover: true}
    }
      return (
        <div className="graphDiv">
          <Graph
            graph={data}
            options={options}
            getNetwork={this.getNetwork}
            getEdges={this.getEdges}
            getNodes={this.getNodes}
            vis={vis => (this.vis = vis)}
          />
        </div>
      )

    }

}

export default TrickGraph