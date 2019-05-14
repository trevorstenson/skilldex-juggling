import React, {Component} from 'react';
import { observer } from "mobx-react"

import './App.css';
import TrickGraph from './trickGraph.js'
import TrickList from './trickList.js'
import {jugglingLibrary, defaultTricks} from './jugglingLibrary.js'
import store from './store'

@observer
class App extends Component {
 	state = {
 		filters : [],
 		selectedList : "allTricks",
 		edges : [],
 		nodes : []
	}
	componentDidMount(){
		const myTricks = JSON.parse(localStorage.getItem("myTricks"))
		if(myTricks){
			store.setMyTricks(myTricks)
			store.updateRootTricks(defaultTricks)
			
		}
	}
 	toggleFilter =(filter)=>{
 		let newFilters = []
 		if(!this.state.filters.includes(filter)){
 			newFilters.push(filter)
 		}
 		this.state.filters.forEach((curFilter)=>{
 			if(curFilter !== filter){
 				newFilters.push(curFilter)
 			}
 			
 		})
 		this.setState({
 			filters : newFilters
 		})
 	}



 	
 	render(){
 		store.nodes
 		store.edges
		return (

		<div className="App">
			<div className="title">
				<h1>Juggledex</h1>
				<h3>Gotta catch em all ;)</h3>	
			</div>
			<div className="listButtonDiv">
				<button className={store.selectedList === "myTricks" ? "selectedListButton" : "unselectedListButton" } onClick={()=>{store.setSelectedList("myTricks")}}>My Tricks</button>
				<button className={store.selectedList === "allTricks" ? "selectedListButton" : "unselectedListButton" } onClick={()=>{store.setSelectedList("allTricks")}}>All Tricks</button>
			</div>
			<TrickList 
				myTricks={store.myTricks} 
				selectedList={store.selectedList}
			/>
			{store.popupTrick ? <div style={{
				left : store.popupTrick.x,
				top : store.popupTrick.y,
				position : "absolute",
				backgroundColor : "white",
				zIndex : "1200"
			}} className="popUpDiv">
              {store.popupTrick.id} 
              {store.popupTrick.x} 
              {store.popupTrick.y}
            </div> : null
          }
			<TrickGraph 
				nodes = {store.nodes}
				edges = {store.edges}
			/>
		</div>
		);
	}
}

export default App;
