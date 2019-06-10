import React, {Component} from 'react';
import uiStore from "./uiStore"
import "./addTrickForm.css"
import { observer } from "mobx-react"
import authStore from "./authStore"
import store from "./store"
import { WithContext as ReactTags } from 'react-tag-input';

import {TAGS} from './tags';

const presetTags = TAGS.map((tag) => {
  return {
  	size: null,
    id: tag,
    text: tag,
  }
})

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

@observer
class AddTrickForm extends Component {
	state = {
		name : "",
		numBalls : "",
		difficulty : "",
		videoURL : "",
		siteSwap : "",
		prereqs : [],
		tags : []

	}

	handleNameChange=(e)=>{
		this.setState({
			name:e.target.value
		})
	}
	handleNumBallsChange=(e)=>{
		this.setState({
			numBalls:e.target.value
		})
	}
	handleDiffChange=(e)=>{
		this.setState({
			difficulty:e.target.value
		})
	}
	handleVideoURLChange=(e)=>{
		this.setState({
			videoURL:e.target.value
		})
	}
	handleSSChange=(e)=>{
		this.setState({
			siteSwap:e.target.value
		})
	}
	handlePrereqAddition=(tag)=> {
        this.setState(state => ({ prereqs: [...state.prereqs, tag] }));
    }
    handlePrereqDelete=(i)=> {
        const { prereqs } = this.state;
        this.setState({
         prereqs: prereqs.filter((tag, index) => index !== i),
        });
    }

    handleTagAddition=(tag)=> {
        this.setState(state => ({ tags: [...state.tags, tag] }));
    }

    handleTagDelete=(i)=> {
        const { tags } = this.state;
        this.setState({
         tags: tags.filter((tag, index) => index !== i),
        });
    }


	submit=()=>{
		function isEmptyOrSpaces(str){
		    return str === null || str.match(/^ *$/) !== null;
		}
		function isOnlyDigits(str){
		    return str.match(/^[0-9]+$/) === null;
		}
		let alertWarnings = "\n"
		let allowSubmit = true
		if (isEmptyOrSpaces(this.state.name)){
			alertWarnings = "'Tricks name' is empty.\n"
			allowSubmit = false
		}

		if (isEmptyOrSpaces(this.state.numBalls)){
			alertWarnings += "'Number of balls' is empty.\n"
			allowSubmit = false
		}else{
			if (isOnlyDigits(this.state.numBalls)){
				alertWarnings += "'Number of balls' must be a number.\n"
				allowSubmit = false
			}
		}
		if (isEmptyOrSpaces(this.state.difficulty)){
			alertWarnings += "'Difficulty' is empty.\n"
			allowSubmit = false
		}else{
			if (isOnlyDigits(this.state.difficulty)){
				alertWarnings += "'Difficulty' must be a number.\n"
				allowSubmit = false
			}
		}
		if (isEmptyOrSpaces(this.state.videoURL)){
			alertWarnings += "'Video URL' is empty.\n"
			allowSubmit = false
		}
		if (allowSubmit){
			var tags = this.state.tags.map(function(item) {
				return item['text'];
			});
			var prereqs = this.state.prereqs.map(function(item) {
				return item['text'];
			});		

			const trick = {
				name : this.state.name,
				num : this.state.numBalls,
				difficulty : this.state.difficulty,
				contributor : authStore.user.username, 
				video : this.state.videoURL,
				siteswap :  this.state.siteSwap,
				prereqs : prereqs,
				tags : tags
			}
			store.addTrickToDatabase(trick)
			this.clearState()
		}else{
			alert(alertWarnings)
		}

	}
	

	cancel=()=>{
		this.clearState()
		uiStore.toggleAddingTrick()
	}

	clearState=()=>{
		this.setState({name : ""})
		this.setState({numBalls : ""})
		this.setState({difficulty : ""})
		this.setState({videoURL : ""})
		this.setState({siteSwap : ""})
		this.setState({prereqs : []})
		this.setState({tags : []})
	}

	render (){
		const patternsObj = Object.keys(store.library).map((pattern) => {
		  return {
		  	size: null,
		    id: pattern,
		    text: pattern,
		  }
		})

		const prereqsInput = <ReactTags
					          autofocus = {false}
					          placeholder = ''
					          inputFieldPosition="bottom"
					          tags={this.state.prereqs}
					          minQueryLength={1}
					          suggestions={patternsObj}
					          delimiters={delimiters}
					          handleDelete={this.handlePrereqDelete}
					          handleAddition={this.handlePrereqAddition}
					          handleTagClick={this.handlePrereqClick}/>

		const tagInput = <ReactTags
					          autofocus = {false}
					          placeholder = ''
					          inputFieldPosition="bottom"
					          tags={this.state.tags}
					          minQueryLength={1}
					          suggestions={presetTags}
					          delimiters={delimiters}
					          handleDelete={this.handleTagDelete}
					          handleAddition={this.handleTagAddition}
					          handleTagClick={this.handleTagClick}/>

		const form = 	
						<div className="form">
							<h3>Add A Trick</h3>
							<div className="innerForm">
								<label>Trick name</label><br/><input className="formInputs" value={this.state.name} onChange={this.handleNameChange}/><br/><br/>
								<label>Tags</label>{tagInput}<br/>
								<label>Prereqs</label>{prereqsInput}<br/>
								<label>Number of balls</label><br/><input className="formInputs" value={this.state.numBalls} onChange={this.handleNumBallsChange}/><br/><br/>
								<label>Difficulty</label><br/><input className="formInputs" value={this.state.difficulty} onChange={this.handleDiffChange}/><br/><br/>
								<label>Video URL (Youtube or Instagram)</label><br/><input className="formInputs" value={this.state.videoURL} onChange={this.handleVideoURLChange}/><br/><br/>
								<label>Siteswap</label><br/><input className="formInputs" value={this.state.siteSwap} onChange={this.handleSSChange}/><br/><br/>
							</div>
								<br/>
								<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								<button className="formButtons"onClick={this.submit}>submit</button>
								<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								<button className="formButtons"onClick={this.cancel}>cancel</button>
						</div>
		return(
				<div>
					{uiStore.addingTrick ? form : null}
				</div>
			)
	}
}
export default AddTrickForm

