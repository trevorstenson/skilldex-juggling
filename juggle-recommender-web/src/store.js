import { action, configure, computed, observable} from "mobx"
import firebase from 'firebase'
import uiStore from './uiStore'
import authStore from './authStore'
configure({ enforceActions: "always" })
class Store {

	@observable myTricks = {}
	@observable showSignInDialog = true

	@computed get isMobile(){
	   return true ?  /Mobi|Android/i.test(navigator.userAgent) : false
	 }
	 //TODO: move to UI store
	@action setShowSignInDialog=(shouldShow)=>{
		this.showSignInDialog = shouldShow
	}

	@action updateTricksInDatabase=()=>{

		if(!authStore.user){return}
		let myTricksKey = ""
 		let myTricksRef = firebase.database().ref('myTricks/').orderByChild('username').equalTo(authStore.user.username)
  	 	myTricksRef.on('value', resp =>{
           const myTricksObject =this.snapshotToArray(resp)[0]
            if(myTricksObject){
            	myTricksKey = myTricksObject.key
            }
            if(myTricksKey){
	            const userTricksRef = firebase.database().ref('myTricks/'+myTricksKey)
		        userTricksRef.set({	        	
		        		'username': authStore.user.username,
		        		'myTricks' : this.myTricks        	
		        })	
            }else{
            	myTricksRef = firebase.database().ref('myTricks/')
                let newData = myTricksRef.push();
                newData.set({"username": authStore.user.username, "myTricks" : []});
            }            
        })
	}

	@action initializeTricks=()=>{
		this.setMyTricks({"Cascade": { "catches":0}})
		uiStore.setSearchInput('common')
		uiStore.selectTricks(['Cascade'])
	}
	@action getTricksFromBrowser=()=>{
		const myTricks = JSON.parse(localStorage.getItem("myTricks"))
    	if(myTricks  && Object.keys(myTricks).length > 0){
    		this.setMyTricks(myTricks)
    		uiStore.setSelectedList("myTricks")
    	}else{
    		this.initializeTricks()
    	}
	}

	@action getSavedTricks=()=>{
		if(authStore.user){
			const myTricksRef = firebase.database().ref('myTricks/').orderByChild('username').equalTo(authStore.user.username)
	  	 	myTricksRef.on('value', resp =>{
	           const myTricksObject =this.snapshotToArray(resp)[0]
	            if(myTricksObject && myTricksObject.myTricks){
	            	if(Object.keys(myTricksObject.myTricks).length > 1){
	            		this.setMyTricks(myTricksObject.myTricks)
	            	}
	            	uiStore.setSearchInput('')
	            }else{
	            	this.getTricksFromBrowser()
	            }	            
	        })
	  	 }else{
	  	 	this.getTricksFromBrowser()
	  	 }
		uiStore.updateRootTricks()
	}
	@action setCatches=(catches, trickKey)=>{
		if (catches.length>1){
 			catches = catches.replace(/^0+/,'');
 		}

 		this.myTricks[trickKey].catches = catches
 	}
	@action addToMyTricks=(trickKey)=>{
 		this.myTricks[trickKey] = {
 			"catches" : 0
 		}
        this.updateTricksInDatabase()
 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
 		uiStore.updateRootTricks()

 	}
 	@action setMyTricks=(tricks)=>{
 		this.myTricks = tricks        
 		uiStore.updateRootTricks()
 	}
 	@action removeFromMyTricks=(trickKey)=>{
		var result = window.confirm("Are you sure you want to remove this pattern and it's data from your list?");
		if (result){
			if (this.myTricks[trickKey]) {
			  delete this.myTricks[trickKey]
			}
			this.updateTricksInDatabase()
	 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
	 		uiStore.updateRootTricks()
		}
 	}

	@action snapshotToArray = snapshot => {
	    let returnArr = [];
	    
	    snapshot.forEach(childSnapshot => {
	        let item = childSnapshot.val();
	        item.key = childSnapshot.key;
	        returnArr.push(item);
	    });
	    return returnArr;
	};
}

const store = new Store()

export default store