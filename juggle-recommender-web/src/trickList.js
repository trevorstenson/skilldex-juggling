import React,{Component} from 'react'
import {jugglingLibrary} from './jugglingLibrary.js'
import store from './store'
import uiStore from './uiStore'
import { observer } from "mobx-react"
import legendImg from './greenToRedFade.jpg'
import sortIcon from './sortIcon.png'
import './trickList.css';
import './App.css';

@observer
class TrickList extends Component {
	 	state = {
 		sortType: 'alphabetical'
	}
	alphabeticalSortObject(data, attr) {
	    var arr = [];
	    for (var prop in data) {

	        if (data.hasOwnProperty(prop)) {
	            var obj = {};
	            obj[prop] = data[prop];
	            obj.tempSortName = data[prop][attr];
	            arr.push(obj);
	        }
	    }
	    arr.sort(function(a, b) {
	        var at = a.tempSortName,
	            bt = b.tempSortName;
	        return at > bt ? 1 : ( at < bt ? -1 : 0 );
	    });
	    var result = {};
	    for (var i=0, l=arr.length; i<l; i++) {
	        var obj = arr[i];
	        delete obj.tempSortName;
	        for (var prop in obj) {
	            if (obj.hasOwnProperty(prop)) {
	                var id = prop;
	            }
	        }
	        var item = obj[id];
	        result[Object.keys(obj)] = item;
	    }
	    return result;
	}

sortClicked=(type)=>{
	uiStore.toggleSortTypeShow()
	this.setState({sortType : type})
}
 
 render() {
 	 window.onclick = function(event) {
 	 	if (event.srcElement['alt'] != 'showSortMenu') {
 	 		if (document.getElementById("myDropdown")){
 				if (document.getElementById("myDropdown").classList.contains('show')){
 					uiStore.toggleSortTypeShow()
 				}
 			}
 		}
 	}
 			//NEXT: can maybe use the stuff above to set the store. sort menu current state, like 
 			//	how showSortMenu does it, but  alittle different


 	let tricks = {
 		"3" : [],
 		"4" : [],
 		"5" : [],
 		"6" : [],
 		"7" : [], 		
 	}
 	let sortedJugglingLibrary
 	if (this.state.sortType === 'alphabetical'){
 	sortedJugglingLibrary = this.alphabeticalSortObject(jugglingLibrary, 'name');
 }else{
 	sortedJugglingLibrary = this.alphabeticalSortObject(jugglingLibrary, 'difficulty');
 }

 	Object.keys(sortedJugglingLibrary).forEach((trickKey, i) => {
		const trick = sortedJugglingLibrary[trickKey]
		var cardClass='listCard'
		var fullStringToSearch = trick.name.toLowerCase()
		trick.tags.forEach(function (tag, index) {
			fullStringToSearch = fullStringToSearch + " " + tag.toLowerCase()
		});
		if(fullStringToSearch.includes(uiStore.searchTrick.toLowerCase()) ){
			if(this.props.selectedTricks && this.props.selectedTricks.includes(trickKey)){
				cardClass = 'selectedListCard'
			}
			if(uiStore.selectedList === "allTricks" || 
				uiStore.selectedList === "myTricks" && store.myTricks[trickKey]
			){
				tricks[trick.num.toString()].push(
					<div onClick={()=>{uiStore.selectTricks([trickKey])}} 
						className={cardClass} 
						key={trickKey + "div"} 
						style={{backgroundColor: cardClass == 'listCard' ?
						uiStore.getInvolvedNodeColor(trick.difficulty, 2).background : uiStore.getSelectedInvolvedNodeColor(trick.difficulty, 2).background}}>
						 {store.myTricks[trickKey] ? 
	  					 <button className="addAndRemoveMyTricksButton" onClick={(e)=>{store.removeFromMyTricks(trickKey);e.stopPropagation()}}>&#9733;</button> :
						 <button className="addAndRemoveMyTricksButton" onClick={(e)=>{store.addToMyTricks(trickKey);e.stopPropagation()}}>&#9734;</button>}
						 <span className="listCardName" title={trick.name}>{trick.name}</span>			
					</div>
				)
			}
		}
	})
 	const buttons = <div>
					 	<label style={{"font-size":"30px",
										"text-align" : "right", 
										"padding-right" : "15px",
										"display" : "block"}} 
								onClick={() => uiStore.setListExpanded(!uiStore.listExpanded)
						}>{uiStore.listExpanded ? "-" : "+"}</label>
				 		<div className="listButtonDiv">
							<button className={uiStore.selectedList === "myTricks" ? "selectedListButton" : "unselectedListButton" } onClick={()=>{uiStore.setSelectedList("myTricks")}}>★Starred</button>
							<button className={uiStore.selectedList === "allTricks" ? "selectedListButton" : "unselectedListButton" } onClick={()=>{uiStore.setSelectedList("allTricks")}}>All</button>
						</div>
			 			<div className="search" >
				 			<input value = {uiStore.searchInput} defaultValue = {Object.keys(store.myTricks).length > 0 ? "" : "common"}  onChange={uiStore.searchInputChange}/>
				 		</div>
			 		</div>
	const sort = <div style={{"display" : "inline-block", "marginLeft" : "5px"}}>
					 <button >
						<img src={sortIcon} alt="showSortMenu" 
					 			onClick={uiStore.showSortMenu} height='15px'width='15px'/>
					 </button>
					  <div title="sort" id="myDropdown" class="dropdown-content">
					    <a onClick={(e)=>this.sortClicked('alphabetical')}>A->Z</a>
					    <a onClick={(e)=>this.sortClicked('difficulty')}>Difficulty</a>
					  </div>
				</div>

	return (	
		<div className="listDiv">				
	 		{uiStore.listExpanded ? 
				<div>
				 	{buttons}
					<div>
						<label style={{float:"left"}}>easy</label>
						<label style={{float:"right", paddingRight:"16px"}}>hard</label>
						<img src={legendImg} alt="legendImg" width="92%"/>						
						<br></br>
						<span onClick={()=>{uiStore.toggleExpandedSection("3")}}>{uiStore.expandedSections["3"] ? "+" : "-"}</span>
						<h3 onClick={()=>{uiStore.toggleExpandedSection("3")}} className="sectionHeader">3 Ball</h3>
						{sort}
						{uiStore.expandedSections["3"] ?
							<div className={tricks["3"].length > 19 ? "listSection" : ""}> 
							{tricks["3"]}
							</div> : null
						}
						
					</div>
					<div>
						<span onClick={()=>{uiStore.toggleExpandedSection("4")}}>{uiStore.expandedSections["4"] ? "+" : "-"}</span>
						<h3 onClick={()=>{uiStore.toggleExpandedSection("4")}} className="sectionHeader">4 Ball</h3>
						{sort}
						{uiStore.expandedSections["4"] ?
							<div className={tricks["4"].length > 19 ? "listSection" : ""}> 
							{tricks["4"]}
							</div> : null
						}
					</div>
					<div>	
						<span onClick={()=>{uiStore.toggleExpandedSection("5")}}>{uiStore.expandedSections["5"] ? "+" : "-"}</span>
						<h3 onClick={()=>{uiStore.toggleExpandedSection("5")}} className="sectionHeader">5 Ball</h3>
						{sort}
						{uiStore.expandedSections["5"] ?
							<div className={tricks["5"].length > 19 ? "listSection" : ""}> 
							{tricks["5"]}
							</div> : null
						}
					</div>
				</div> : 
				buttons
			}
		</div>
	)
  }
}
export default TrickList