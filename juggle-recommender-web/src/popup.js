import React,{Component} from 'react'
import store from './store'
import uiStore from './uiStore'
import { observer } from "mobx-react"
import editIcon from './editIcon.png'
import fullScreenIcon from './fullScreenIcon.png'
import minimizeIcon from './minimizeIcon.png'

import './App.css';
import './popup.css';

@observer
class Popup extends Component {


  state = {
    catches : null,
    gifFullscreen : false
  }
	onCatchesChange=(e)=>{

	 	const re = /^[0-9\b]+$/;
	  	if (e.target.value === '' || re.test(e.target.value)) {
	       const catches = e.target.value
         this.setState({catches})
  	  	}
	}

  onCatchesKeyPress=(target)=> {
    // If enter pressed
    if(target.charCode===13){  
      uiStore.toggleCatchEdit(this.state.catches, uiStore.popupTrick.id)
    } 
  }
  seeExplanation=(trickKey)=>{
    if(!uiStore.popupTimer){
        window.open(store.library[trickKey].url)
    }
  }
  addToMyTricks=()=>{
    this.setState({"catches":0})
    store.addToMyTricks(uiStore.popupTrick.id)
  }
  handleEditButtonClick=()=>{
    this.setState({catches:store.myTricks[uiStore.popupTrick.id].catches})
    uiStore.toggleCatchEdit(this.state.catches,uiStore.popupTrick.id)
    var input
    function setFocus() {
      if (document.getElementById('catchInput')){
        input = document.getElementById("catchInput");   
        input.focus();
        input.select();   
      }
    }
      setTimeout(function() {
          setFocus();
      }, 100);  
}

toggleGifFullscreen=()=>{
  this.setState({'gifFullscreen':!this.state.gifFullscreen})
}

	render() {

    document.addEventListener("click", (evt) => {
      const inputElement = document.getElementById("catchInput");
      const buttonElement = document.getElementById("editCatchButton");
      let targetElement = evt.target;
      do {
        if (targetElement === inputElement || targetElement === buttonElement) {
          return;
        }
        targetElement = targetElement.parentNode;
      } while (targetElement);
      if (uiStore.popupCatchEditable){
        uiStore.toggleCatchEdit(this.state.catches, uiStore.popupTrick.id)
      }
    });
    const popupTrickKey = uiStore.popupTrick ? uiStore.popupTrick.id : ""
    const catchesSection = store.myTricks[popupTrickKey] ?
    <div>
      <label>Catches: </label>
      {uiStore.popupCatchEditable ?
        <input id = "catchInput"
               type="number" 
               onKeyPress = {(e)=>this.onCatchesKeyPress(e)}
               onChange={this.onCatchesChange}/> :
        <span>{store.myTricks[popupTrickKey].catches}</span>
      }
      <img id="editCatchButton" src={editIcon} className="editCatchIcon" alt="toggleCatchEdit" 
           onClick={()=>{ this.handleEditButtonClick()}}/>
    </div> : null
		const graphDiv = document.getElementById("graphDiv")
 		const addToMyTricksButton = uiStore.popupTrick && store.myTricks[uiStore.popupTrick.id] ? 
              		<button className="addAndRemoveMyTricksButtonOnPopup" onClick={()=>{store.removeFromMyTricks(uiStore.popupTrick.id)}}>&#9733;</button> :
 		              <button className="addAndRemoveMyTricksButtonOnPopup" onClick={this.addToMyTricks}>&#9734;</button>

    const gifSection = store.library[popupTrickKey] && store.library[popupTrickKey].url? 
                        <div className = "gifDiv">
                          <img src={fullScreenIcon} className="fullScreenIcon" alt="" onClick={this.toggleGifFullscreen} />
                          <img width = '100' 
                               alt = ''
                               className="popupGif" 
                               src={store.library[popupTrickKey].gifUrl}/> 
                        </div> : null
    var videoURLtoUse
    var videoIframe
    if (store.library[popupTrickKey] && 
        store.library[popupTrickKey].video){
        if (store.library[popupTrickKey].video.includes("instagram.com")){
            const usefulPart = 
                store.library[popupTrickKey].video.match
                (new RegExp("(?:/p/)(.*?)(?:/)", "ig"))
            videoURLtoUse = "https://www.instagram.com"+usefulPart+"embed"
            videoIframe = <iframe className="popupGif"
                                  frameBorder="0"  
                                  allowtransparency="true"
                                  src={videoURLtoUse}></iframe>
                                  
        }
        else if(store.library[popupTrickKey].video.includes("youtu")){
          if (store.library[popupTrickKey].video.includes("youtube.com/watch")){
            const usefulPart = store.library[popupTrickKey].video.split('youtube.com/watch?v=')
            //https://www.youtube.com/watch?v=Kr8LhLGjyiY
            videoURLtoUse ="https://www.youtube.com/embed/" + usefulPart[usefulPart.length-1]
          }else if (store.library[popupTrickKey].video.includes("youtu.be/")){
            //https://youtu.be/Kr8LhLGjyiY
            const usefulPart = store.library[popupTrickKey].video.split('youtu.be/')
            videoURLtoUse ="https://www.youtube.com/embed/"+usefulPart[usefulPart.length-1]
          }
          videoIframe = <iframe width="260" 
                                src={videoURLtoUse} 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen></iframe>
        }
    }
    const videoSection = store.library[popupTrickKey] && store.library[popupTrickKey].video ?
                        <div className = "gifDiv">
                          <img src={fullScreenIcon} className="fullScreenIcon" alt="" onClick={this.toggleGifFullscreen} />
                          {videoIframe}
                        </div> : null
    const gifFullScreenPopup = 
          store.library[popupTrickKey] && store.library[popupTrickKey].gifUrl?
              <div className="fullScreenPopup">
                <img src={minimizeIcon} className="fullScreenIcon" alt="" onClick={this.toggleGifFullscreen} />
                <img  height = '90%'
                      alt = ''                   
                      src={store.library[popupTrickKey].gifUrl}/> 
              </div> 
             : null
    const popupCard = uiStore.popupTrick && popupTrickKey ? 
          			    <div style={{left : Math.min(graphDiv.clientWidth-260,uiStore.popupTrick.x),
                    					   top : Math.min(graphDiv.clientHeight-460,uiStore.popupTrick.y),
                                 width : 260,}} 
                         className="popupDiv">
                      <h3>{addToMyTricksButton}{store.library[popupTrickKey].name}</h3>             
                      {catchesSection}                         		
                      <label>Difficulty: {store.library[popupTrickKey].difficulty} / 10</label><br/>
                      {store.library[popupTrickKey].siteswap ? 
                        <div>
                          <label>Siteswap: {store.library[popupTrickKey].siteswap}</label><br/><br/>
                        </div> : null
                      } 
                    	{store.library[popupTrickKey] && store.library[popupTrickKey].url? 
                    		<span 
                         onClick={()=>{this.seeExplanation(popupTrickKey)}}
                         className="popupLink"
                    		>See explanation</span> : null
                      }
                      {videoSection}
                      {gifSection}
                      <br></br><br/><br/>
                      {store.library[popupTrickKey] && store.library[popupTrickKey].tags?
                    		<label className="popupTags">
                    			Tags: {store.library[popupTrickKey].tags.join(', ')} 
                    		</label> : null
                      }<br></br>
                      {store.library[popupTrickKey] && store.library[popupTrickKey].related && store.library[popupTrickKey].related.length>0 ?
                        <label className="popupTags">
                          Related: {store.library[popupTrickKey].related.join(', ')} 
                        </label> : null
                      }
                    </div> : null
    
		return(
      			<div>{this.state.gifFullscreen ?
      				    gifFullScreenPopup : popupCard
                }
      			</div>
          )
    }
  }

export default Popup