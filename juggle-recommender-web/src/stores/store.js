import { action, configure, computed, observable, toJS} from "mobx"
import firebase from 'firebase'
import uiStore from './uiStore'
import authStore from './authStore'
import {jugglingLibrary} from '../jugglingLibrary.js'
import {TAGS} from '../tags';
import ReactGA from 'react-ga'
import history from "../history"
configure({ enforceActions: "always" })
class Store {

	@observable startTime = null
	@observable myTricks = {}
	@observable highestCatches = 0
	@observable isLoginPaneOpen = false
	@observable isCreateAccountPaneOpen = false
	@observable isForgotPasswordPaneOpen = false
	@observable library = {}
	@observable tagsSuggestions = []
	@observable contributors = []
	@observable presetTags = {}
	@observable videoURL = ""
	@observable randomLeaderboardTrick = null
	@observable mostRecentlySubmittedTrickKey = null
	@observable userCount = ""
	@observable totalCatchCount = null
	@observable currentComments = []
	@observable showReplyStates = {}
	@observable enableReplyStates = {}

	@computed get isMobile(){
	   return true ?  /Mobi|Android/i.test(navigator.userAgent) : false
	}
	@computed get isLocalHost(){
		if(window.location.host.includes("localhost") || window.location.host.match(/(\.\d+){3}/)){
			return true
		}else{
			return false
		}
	}
	@computed get contributorTags(){
		let contributors = []
		for (let trick in this.library){
  			if (this.library[trick].contributor && 
  				!contributors.includes(this.library[trick].contributor)){
  					contributors.push(this.library[trick].contributor)
			}
  		}
  		contributors.push('libraryofjuggling.com')
  		contributors = contributors.sort()
  		this.setContributors(contributors)
 		const contributorTags = contributors.map((contributor) => {
		  return {
		  	size: null,
		    id: contributor,
		    text: contributor,
		  }
		})
		return contributorTags
	}
	@action vote(parentTrick, relatedTrickKey,listType, direction){
		const oppositeDirection = direction == "upvoters" ? "downvoters" : "upvoters" 
		if(listType == "postreqs"){ listType = "dependents"}
		const relatedTrick = this.library[parentTrick][listType][relatedTrickKey]
		//first voter
		if(!relatedTrick[direction]){
			relatedTrick[direction] = []
		}
		//voter already included
		if(relatedTrick[direction] && relatedTrick[direction].includes(authStore.user.username)){
			relatedTrick[direction] = relatedTrick[direction].filter((value)=>{
			    return value != authStore.user.username;
			});
		}else{
			//voter not included
			relatedTrick[direction].push(authStore.user.username)
		}
		//voter included in opposite direction
		if(
			relatedTrick[oppositeDirection] && 
			relatedTrick[oppositeDirection].includes(authStore.user.username)
		){
			relatedTrick[oppositeDirection] = relatedTrick[oppositeDirection].filter((value)=>{
			    return value != authStore.user.username;
			});
			const oppositeVotesRef = firebase.database().ref(
				'library/'+parentTrick+ 
				"/"+listType + 
				"/" + relatedTrickKey + 
				"/" + oppositeDirection
			)
			oppositeVotesRef.set(relatedTrick[oppositeDirection])
		}
		//Set vote
		const relatedTricksRef = firebase.database().ref(
			'library/'+parentTrick+ 
			"/"+listType + 
			"/" + relatedTrickKey + 
			"/" + direction
		)
		console.log(relatedTrick, relatedTricksRef)
		relatedTricksRef.set(relatedTrick[direction])
	}
	@action getCommentsByTrickId(trickId){
		const commentsRef = firebase.database().ref('comments/').orderByChild("trickId").equalTo(trickId)
		let parentComments = []
		commentsRef.on('value', resp =>{
			const allComments = this.snapshotToArrayWithKey(resp)
            allComments.forEach(
                function(curComment){
                    if(!curComment["parentId"]){
                        parentComments.push(curComment)
                    }
            })
            this.setComments(this.filterUniqueComments(parentComments))
		})
	}
	@action filterUniqueComments(currentComments){
        let comments = {}
        currentComments.forEach((comment)=>{
            comments[comment["key"]] = comment
        }) 
        currentComments = []         
        for(var commentKey in comments){
            currentComments.push(comments[commentKey])
        }
        return currentComments
    }
	@action setComments(comments){
		this.currentComments = comments
	}
	@action createComment(comment) {
      const that = this
      const commentsRef = firebase.database().ref('comments/'+comment.previousKeys);
      let parentComments = []
      if(!store.isLocalHost){
		ReactGA.event({
			category: 'comment',
			action: "commented " + comment.trickId,
		});
	  }	
      return new Promise((resolve, reject) => {

        let newData = commentsRef.push();
        newData.set(comment);
        if (comment["parentId"]) {
            
            const repliesRef = firebase.database().ref('comments/' + comment.previousKeys.replace("replies/","") + '/numReplies')
            repliesRef.transaction(function (currentValue) {
                return (currentValue || 0) + 1;
            });
        }
        resolve(comment)
      });
    }
    @action getCommentReplies(refPath){
        const comments = firebase.database().ref('comments/'+refPath)
        return new Promise(resolve => {
            comments.on('value', resp => {
                resolve(this.snapshotToArrayWithKey(resp))
            });
        }); 
    }

    @action toggleShowReplies(commentKey){
    	if(this.showReplyStates[commentKey]){
    		this.showReplyStates[commentKey] = !this.showReplyStates[commentKey]
    	}else{
    		this.showReplyStates[commentKey] = true
    	}
    	this.showReplyStates = {...this.showReplyStates}
    }
    @action clearShowReplies(){
    	this.showReplyStates = {}
    }
    @action toggleEnableReplies(commentKey){
    	
    	if(!this.enableReplyStates[commentKey]){
    		this.enableReplyStates = {}
    		this.enableReplyStates[commentKey] = true
    		this.enableReplyStates = {...this.enableReplyStates}
    	}else{
    		this.enableReplyStates = {}
    	}
    }
	@action getMostRecentlySubmittedTrick(){
		let mostRecentlySubmittedTrickKey = ''
		let mostRecentlySubmittedTrickTime = 0
		let trickKey
		for (trickKey in this.library){
			if (parseInt(this.library[trickKey]['timeSubmitted'],10)>mostRecentlySubmittedTrickTime){
				mostRecentlySubmittedTrickTime = parseInt(this.library[trickKey]['timeSubmitted'],10)
				mostRecentlySubmittedTrickKey = trickKey
			}
		}
		return mostRecentlySubmittedTrickKey
	}
	@action getTrickOfTheDay(){
		let trickKeyToUse = null
		const currentDate = new Date()
		const formatted_date = (currentDate.getMonth() + 1).toString() + (currentDate.getDate() + 1).toString()
		let trickOfTheDayReadRef = firebase.database().ref('trickOfTheDay/')
		trickOfTheDayReadRef.on('value', resp =>{
			let allTricksOfTheDay = this.snapshotToArrayWithKey(resp)
			let trickOfTheDay
			for (trickOfTheDay in allTricksOfTheDay){
				if (allTricksOfTheDay[trickOfTheDay]['date'] === formatted_date){
					trickKeyToUse = allTricksOfTheDay[trickOfTheDay]['trick']
				}
			}
		   	let leaderboardRef = firebase.database().ref('leaderboard/')
		   	let trickToUse
			leaderboardRef.on('value', resp =>{
				let allLeaderBoardTricks = this.snapshotToArrayWithKey(resp)
				if (!trickKeyToUse){
					var keys = Object.keys(this.library)
    				trickKeyToUse = keys[ keys.length * Math.random() << 0];
					const trickToSet = {	
						date: formatted_date,
						trick: trickKeyToUse,
					}		
					let trickOfTheDayWriteRef = firebase.database().ref('trickOfTheDay/'+formatted_date)
					trickOfTheDayWriteRef.set(trickToSet);
				}
				trickToUse = {...this.snapshotToObject(resp)[trickKeyToUse], key:trickKeyToUse}
				this.setTrickOfTheDay(trickToUse)
				leaderboardRef.off()
				trickOfTheDayReadRef.off()
    		})
			trickOfTheDayReadRef.off()
        }) 
	}
	@action setTrickOfTheDay=(randomTrick)=>{
		this.randomLeaderboardTrick = randomTrick
	}
	@action updateTotalCatchCount(amount){
	   	const totalCatchCountRef = firebase.database().ref('stats')
	   	let currentTotalCatchCount
		totalCatchCountRef.on('value', resp =>{
			currentTotalCatchCount = this.snapshotToArray(resp)[0]
        })
		let leaderboardTrickRef = firebase.database().ref('stats')
		const updatedStats = {'totalCatchCount':currentTotalCatchCount + amount}
		leaderboardTrickRef.set(updatedStats);

	}
	@action setStartTime=(startTime)=>{
		this.startTime = startTime
	}
	@action setContributors=(contributors)=>{
		this.contributors = contributors
	}
	
	@action setIsLoginPaneOpen=(isOpen)=>{
		this.isLoginPaneOpen = isOpen
	}
	@action toggleCreateAccountPane=()=>{
		this.isCreateAccountPaneOpen = !this.isCreateAccountPaneOpen
	}
	@action toggleForgotPasswordPane=()=>{
		this.isForgotPasswordPaneOpen = !this.isForgotPasswordPaneOpen
	}
	@action updateTricksInDatabase=()=>{
		if(!authStore.user){return}
		let myTricksKey = ""
 		let myTricksRef = firebase.database()
 									.ref('myTricks/')
 									.orderByChild('username')
 									.equalTo(authStore.user.username)
  	 	myTricksRef.on('value', resp =>{
           const myTricksObject =this.snapshotToArrayWithKey(resp)[0]
            if(myTricksObject){
            	myTricksKey = myTricksObject.key
            }
            myTricksRef.off()
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
	
	@action getTricksFromBrowser=()=>{
		const myTricks = JSON.parse(localStorage.getItem("myTricks"))
    	if(myTricks  && Object.keys(myTricks).length > 0){
    		this.setMyTricks(myTricks)
    		//uiStore.setSelectedList("myTricks")
    	}else{
    		uiStore.setSelectedList("allTricks")
    	}
	}
	@action initializeLibrary=()=>{
		let libraryRef = firebase.database().ref('library/')
        libraryRef.set(jugglingLibrary);
	}
	@action getLibraryFromDatabase=()=>{
		return new Promise(resolve => {
			let libraryRef = firebase.database().ref('library/')
			libraryRef.on('value', resp =>{
	        	this.setLibrary(this.snapshotToObject(resp))
	        	this.setPatternCount(this.snapshotToArray(resp).length)
	        	resolve()
	        })
	    })
	}
	@action setPatternCount=(count)=>{
		this.patternCount = count
	}
	@action getUserCountFromDatabase=()=>{
		let libraryRef = firebase.database().ref('users/')
		libraryRef.on('value', resp =>{
        	this.setUserCount(this.snapshotToArray(resp).length)
        })		
	}
	@action setUserCount=(count)=>{
		this.userCount = count
	}
	@action getTotalCatchCountFromDatabase=()=>{
		let libraryRef = firebase.database().ref('stats/')
		libraryRef.on('value', resp =>{
        	this.setTotalCatchCount(this.snapshotToArray(resp)[0])
        })
	}
	@action setTotalCatchCount=(count)=>{
		this.totalCatchCount = count
	}
	@action ObjectLength=(object)=> {
	    var length = 0;
	    for( var key in object ) {
	        if( object.hasOwnProperty(key) ) {
	            ++length;
	        }
	    }
	    return length;
	}
	@action setLibrary=(library)=>{
		this.library = library
		//TODO clean this up
		uiStore.updateRootTricks() 
		uiStore.resetSelectedTrick()
		uiStore.updateRootTricks()
	}

	@action initializeTags=()=>{
		let tagRef = firebase.database().ref('tags/')
        tagRef.set(TAGS);
	}
	@action getTagsFromDatabase=()=>{
		let tagRef = firebase.database().ref('tags/')
		tagRef.on('value', resp =>{
        	this.setTagsSuggestions(this.snapshotToArray(resp))
        })
	}
	@action setTagsSuggestions=(tagsSuggestions)=>{
		this.tagsSuggestions = tagsSuggestions.sort()
		this.presetTags = this.tagsSuggestions.map((tag) => {
		  return {
		  	size: null,
		    id: tag,
		    text: tag,
		  }
		})
	}	
	@action removeOldDependents=(newTrickData, oldTrickKey)=>{
		const oldTrick = this.library[oldTrickKey]
		if(oldTrick.prereqs){
			let stalePrereqs
			if(newTrickData){
				stalePrereqs = oldTrick.prereqs.filter(x => !newTrickData.prereqs.includes(x))
			}else{//for the case of deleting a trick
				stalePrereqs = oldTrick.prereqs
			}
			stalePrereqs.forEach((prereq)=>{
				const trick = this.library[prereq]
				if(trick && trick.dependents){
					const newDependents = trick.dependents.filter((x)=> x !== oldTrickKey)
					let newTrickRef = firebase.database().ref('library/'+prereq+'/dependents')
	        		newTrickRef.set(newDependents);
					// const newDependents = trick.dependents.filter((x)=> x !== oldTrickKey)
					// trick.dependents = newDependents
					// //update prereq's dependents in db
					// let newTrickRef = firebase.database().ref('library/'+prereq)
	    //     		newTrickRef.set(trick);
	        	}
			})
		}
	}
	@action removeOldPrereqs=(newTrickData, oldTrickKey)=>{
		const oldTrick = this.library[oldTrickKey]
		if(oldTrick.dependents){
			let staleDependents
			if(newTrickData){
				staleDependents = oldTrick.dependents.filter(x => !newTrickData.dependents.includes(x))
			}else{//for the case of deleting a trick
				staleDependents = oldTrick.dependents
			}
			staleDependents.forEach((dependent)=>{
				const trick = this.library[dependent]
				if(trick && trick.prereqs){
					const newPrereqs = trick.prereqs.filter((x)=> x !== oldTrickKey)
					let newTrickRef = firebase.database().ref('library/'+dependent+'/prereqs')
	        		newTrickRef.set(newPrereqs);
	        	}
			})
		}
	}
	@action removeOldRelated=(newTrickData, oldTrickKey)=>{
		const oldTrick = this.library[oldTrickKey]
		if(oldTrick.related){
			let staleRelated
			if(newTrickData){
				staleRelated = oldTrick.related.filter(x => !newTrickData.related.includes(x))
			}else{//for the case of deleting a trick
				staleRelated = oldTrick.related
			}
			staleRelated.forEach((relatedTrick)=>{
				const trick = this.library[relatedTrick]
				if(trick && trick.related){
					const newRelated = trick.related.filter((x)=> x !== oldTrickKey)
					let newTrickRef = firebase.database().ref('library/'+relatedTrick+'/related')
	        		newTrickRef.set(newRelated);
	        	}
			})
		}
	}
	@action changeNameInAllUsersMyTricks=(newTrick,oldTrickKey)=>{
		let allUsersMyTricks
		let fullDBRef = firebase.database().ref()
		fullDBRef.on('value', resp =>{
        	const fullDB = this.snapshotToArray(resp)
        	allUsersMyTricks = fullDB['myTricks']
        	Object.keys(allUsersMyTricks).forEach((user)=>{
        		if (user['myTricks']){
					Object.keys(user['myTricks']).forEach((trickKey)=>{
						if (trickKey === oldTrickKey){	
							user['myTricks'][newTrick.name] = user['myTricks'][oldTrickKey]
							delete user['myTricks'][oldTrickKey]
						}
					})
				}
			})
			let newMyTricksRef = firebase.database().ref('myTricks/')	
			newMyTricksRef.set(allUsersMyTricks)
        })   
	}
	@action removeTrickFromDatabase=(oldTrickKey)=>{
    	let oldTrickRef = firebase.database().ref('library/'+oldTrickKey)
		oldTrickRef.remove()
	}
	@action deleteTrick=()=>{
		var result = window.confirm("Are you sure you want to permanently delete this pattern?");
		if (result){

			const trickToDelete = uiStore.detailTrick.id
			uiStore.detailTrick = null
		    this.removeOldDependents(null,trickToDelete)
		    this.removeOldPrereqs(null,trickToDelete)
		    this.removeOldRelated(null,trickToDelete)
		    this.removeTrickFromDatabase(trickToDelete)
		    history.go(-1);
		}


	 }
	@action addTrickToDatabase=(trick)=>{
		const trickKey = 
			trick.name.replace(/\[/g,'({').replace(/\]/g,'})').replace(/\//g,'-')
		let oldTrickKey
		let shouldBackUpBecauseEditing = false
		if(uiStore.editingDetailTrick){
			oldTrickKey = uiStore.detailTrick.id
			this.removeOldDependents(trick,oldTrickKey)
			this.removeOldPrereqs(trick,oldTrickKey)
			this.removeOldRelated(trick,oldTrickKey)
			this.changeNameInAllUsersMyTricks(trick,oldTrickKey)
			if (trickKey == oldTrickKey){
				shouldBackUpBecauseEditing = true
			}
			console.log('trickKey',trickKey)
			console.log('oldTrickKey',oldTrickKey)
			console.log('this.randomLeaderboardTrick.key',this.randomLeaderboardTrick.key)
			if (trickKey !== oldTrickKey && oldTrickKey === this.randomLeaderboardTrick.key){
				console.log('changeTrick')
				let leaderboardRef = firebase.database().ref('leaderboard/')
				leaderboardRef.on('value', resp =>{
				let allLeaderBoardTricks = this.snapshotToArrayWithKey(resp)
					const currentDate = new Date()
					const formatted_date = (currentDate.getMonth() + 1).toString() + (currentDate.getDate() + 1).toString()
					const trickToSet = {	
						date: formatted_date,
						trick: trickKey,
					}		
					let trickOfTheDayWriteRef = firebase.database().ref('trickOfTheDay/'+formatted_date)
					trickOfTheDayWriteRef.set(trickToSet);
					const trickToUse = {...this.snapshotToObject(resp)[trickKey], key:trickKey}
					this.setTrickOfTheDay(trickToUse)
					leaderboardRef.off()
				})
			}
		}
		let newTrickRef = firebase.database().ref('library/'+trickKey)
        newTrickRef.set(trick);
        //if name changed, delete old reference in firebase
        //delete in mytricks and selected tricks, swap with new key
        
        if(uiStore.editingDetailTrick && trickKey !== uiStore.detailTrick.id){
        	if(uiStore.selectedTrick === oldTrickKey){
    			uiStore.toggleSelectedTrick(oldTrickKey)
    			uiStore.toggleSelectedTrick(trickKey)
    		}
        	if(this.myTricks[oldTrickKey]){
        		this.myTricks[trickKey] = this.myTricks[oldTrickKey]
        		delete this.myTricks[oldTrickKey]
        		this.updateTricksInDatabase()
		 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
        	}
        	let oldTrickRef = firebase.database().ref('library/'+oldTrickKey)
			oldTrickRef.remove()
		}

        this.addEquivalentRelated(trick,"prereqs")
        this.addEquivalentRelated(trick,"related")
        this.addEquivalentRelated(trick,"dependents")
        uiStore.toggleAddingTrick()
		uiStore.setDetailTrick(	{...store.library[trickKey], id: trickKey} )
        history.replace('/detail/'+trickKey, {detail : trickKey})
        if(shouldBackUpBecauseEditing){
        	uiStore.handleBackButtonClick()
        }

        
	}
	
	@action addEquivalentRelated=(trick,relation)=>{
		const relatedProperty = relation == "related" ? "related" : 
								relation == "prereqs" ? "dependents" :
								"prereqs"
		if(trick[relation]){
			trick[relation].forEach((item)=>{
				const relatedTrick = item.replace(/\[/g,'({').replace(/\]/g,'})').replace(/\//g,'-')				
				if(!this.library[relatedTrick]){
					console.log("problem with ",relatedTrick)
				}
				if(this.library[relatedTrick]){
					if (!this.library[relatedTrick][relatedProperty]){
						this.library[relatedTrick][relatedProperty] = []	
					}
					if (!this.library[relatedTrick][relatedProperty].includes(trick.name)){
						this.library[relatedTrick][relatedProperty].push(trick.name)
						let relatedWriteRef = firebase.database().ref('library/'+relatedTrick+'/'+relatedProperty)
				    	relatedWriteRef.set([...this.library[relatedTrick][relatedProperty]]);
	    		    }
        		}
			})
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
	            	uiStore.resetSelectedTrick()
	            	uiStore.updateRootTricks()
	            }else{
	            	//For when we delete data for existing users
	            	this.getTricksFromBrowser()
	            	uiStore.resetSelectedTrick()
					uiStore.updateRootTricks()
	            }	           
	        })
	  	 }else{
	  	 	//Not logged in
	  	 	this.getTricksFromBrowser()
	  	 	uiStore.resetSelectedTrick()
	  	 	uiStore.updateRootTricks()
	  	 }	  
	}
	@action setCatches=(catches, trickKey)=>{
		if(!catches){
			catches = 0
		}
		if (catches.length>1){
 			catches = catches.replace(/^0+/,'');
 		}
 		if(!this.myTricks[trickKey]){
			this.myTricks[trickKey] = {}
		}		
 		this.myTricks[trickKey].catches = catches
 		const date = new Date()
 		this.myTricks[trickKey].lastUpdated = date.getTime()
 		this.updateTricksInDatabase()
 		if(!this.isLocalHost){
			ReactGA.event({
				  category: 'catches',
				  action: "set catches " + trickKey + " " + catches,
			});
		}	
 		uiStore.updateRootTricks()
		this.updateLeaderboard(trickKey,catches)
 	}

 	@action updateLeaderboard=(trickKey,catches)=>{
	   	let leaderboardRef = firebase.database().ref('leaderboard/')
	   	let currentLeaderboardCatches
	   	let newLeaderEntry = {}
		leaderboardRef.on('value', resp =>{
			let allLeaderBoardTricks = this.snapshotToObject(resp)
			if(allLeaderBoardTricks[trickKey]){
				currentLeaderboardCatches = parseInt(allLeaderBoardTricks[trickKey]['catches'],10)
			}
	 		if (parseInt(catches)<currentLeaderboardCatches &&
	 			authStore.user.username === allLeaderBoardTricks[trickKey]['user']){
	 			let allUsersMyTricksRef = firebase.database().ref('myTricks/')
				allUsersMyTricksRef.on('value', resp =>{	 
					let allUsersMyTricks = this.snapshotToObject(resp)
					let userid
						newLeaderEntry = {
			 				user: authStore.user.username,
			 				catches: catches,
			 				trick: trickKey
			 			}	
					for (userid in allUsersMyTricks){
						if (allUsersMyTricks[userid] &&
							allUsersMyTricks[userid]['myTricks'] && 
							allUsersMyTricks[userid]['myTricks'][trickKey] && 
							allUsersMyTricks[userid]['myTricks'][trickKey]['catches'] &&
							parseInt(allUsersMyTricks[userid]['myTricks'][trickKey]['catches'],10) >
							newLeaderEntry.catches){
								newLeaderEntry = {
					 				user: allUsersMyTricks[userid]['username'],
					 				catches: allUsersMyTricks[userid]['myTricks'][trickKey]['catches'],
					 				trick: trickKey
					 			}
						}
			 			let leaderboardTrickRef = firebase.database().ref('leaderboard/'+trickKey)
		        		leaderboardTrickRef.set(newLeaderEntry);
		        		leaderboardRef.off()
					}
				});			
	 		}else if(parseInt(catches)>currentLeaderboardCatches){ 			
	 			newLeaderEntry = {
	 				user: authStore.user.username,
	 				catches: catches,
	 				trick: trickKey
	 			}
	 			let leaderboardTrickRef = firebase.database().ref('leaderboard/'+trickKey)
        		leaderboardTrickRef.set(newLeaderEntry);
        		leaderboardRef.off()
	 		}
        })
	}

	@action toggleFlair=(trickKey,flairType)=>{
		if(!this.myTricks[trickKey]){
			this.myTricks[trickKey] = {}
		}
		if (this.myTricks[trickKey][flairType] === 'false' || 
			!this.myTricks[trickKey][flairType]){
	 		this.myTricks[trickKey][flairType] = 'true'
	 		const date = new Date()
	 		this.myTricks[trickKey].lastUpdated = date.getTime()
	 		if(flairType === "baby" && this.myTricks[trickKey]["ninja"] === 'true'){
	 			this.toggleFlair(trickKey, "ninja")
	 		}
	 		if(flairType === "ninja" && this.myTricks[trickKey]["baby"] === 'true'){
	 			this.toggleFlair(trickKey, "baby")
	 		}
	 	}else{
	 		this.myTricks[trickKey][flairType] = 'false'
	 	}
	 	this.myTricks = {...this.myTricks}
 		this.updateTricksInDatabase()
 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
 		uiStore.updateRootTricks()
 	}

 	@action findHighestCatches=()=>{
	    for(var trick in this.myTricks) {
	        if(this.myTricks[trick].catches>this.highestCatches){
	          this.highestCatches = parseInt(this.myTricks[trick].catches, 10)
	        }       
	    }
 	}
 	@action setMyTricks=(tricks)=>{
 		this.myTricks = tricks        
 		uiStore.updateRootTricks()
 		this.findHighestCatches()
 	}

	@action snapshotToArray=(snapshot)=>{
	    let returnArr = [];	    
	    snapshot.forEach(childSnapshot => {
	    	let item = childSnapshot.val();
	        returnArr.push(item);
	    });
	    return returnArr;
	}
	@action snapshotToArrayWithKey=(snapshot)=>{
	    let returnArr = [];	    
	    snapshot.forEach(childSnapshot => {
	        let item = childSnapshot.val();
	        item.key = childSnapshot.key;
	        returnArr.push(item);
	    });
	    return returnArr;
	}
	@action snapshotToObject=(snapshot) => {
	  let returnObj = {};
	  //returnObj["key"] = Object.keys(snapshot.val())[0]
	  snapshot.forEach(childSnapshot => {
	      returnObj[childSnapshot.key] = childSnapshot.val()
	  });
	  return returnObj;
	}
}

const store = new Store()

export default store