(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{104:function(e,t,a){e.exports=a(231)},211:function(e,t,a){},215:function(e,t,a){},217:function(e,t,a){},219:function(e,t,a){},221:function(e,t,a){},223:function(e,t,a){},225:function(e,t,a){},231:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),i=a(102),s=a.n(i),c=a(2),l=a(3),o=a(5),u=a(4),m=a(6),p=a(234),h=a(233),d=(a(95),a(12)),b=a.n(d),E=a(232),f=(a(211),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e;return this.props.isLoggedIn?(e=r.a.createElement("li",null,r.a.createElement(E.a,{to:"/profile"},"Profile")),r.a.createElement("li",null,r.a.createElement(E.a,{to:"/logout"},"Logout"))):(e=r.a.createElement("li",null,r.a.createElement(E.a,{to:"/signup"},"Signup")),r.a.createElement("li",null,r.a.createElement(E.a,{to:"/login"},"Login"))),r.a.createElement("div",{className:"navbar"},r.a.createElement("ul",null,e))}}]),t}(n.Component)),g=a(9),v=(a(215),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("form",{action:"",onSubmit:this.props.loginSubmit},r.a.createElement("div",{className:"inputContainer"},r.a.createElement("input",{className:"form-control",name:"email",ref:"email",type:"email",placeholder:"Email Address"})),r.a.createElement("div",{className:"inputContainer"},r.a.createElement("input",{className:"form-control",name:"password",ref:"password",type:"password",placeholder:"Password"})),r.a.createElement("div",{className:"formButtonContainer"},r.a.createElement("button",{className:"loginButton"},"Sign in")))}}]),t}(n.Component)),O=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("form",{action:"",onSubmit:this.props.signupSubmit},r.a.createElement("div",{className:"inputContainer"},r.a.createElement("input",{className:"form-control",name:"email",ref:"email",type:"email",placeholder:"Email Address"})),r.a.createElement("div",{className:"inputContainer"},r.a.createElement("input",{className:"form-control",name:"username",ref:"username",type:"username",placeholder:"Username"})),r.a.createElement("div",{className:"inputContainer"},r.a.createElement("input",{className:"form-control",name:"password",ref:"password",type:"password",placeholder:"Password"})),r.a.createElement("div",{className:"formButtonContainer"},r.a.createElement("button",{className:"loginButton"},"Sign up")))}}]),t}(n.Component),j=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).loginSubmit=function(e){e.preventDefault();var t=e.target.email.value,n=e.target.password.value;b.a.post("api/login",{email:t,password:n}).then(function(e){e.data&&a.props.history.push("/stage/1")}).catch(function(e){throw e})},a.signupSubmit=function(e){e.preventDefault(),b.a.post("api/signup").then(function(e){e.data&&a.props.history.push("/stage/1")})},a.formButton=function(){a.state.Signup?a.setState({Signup:!1}):a.setState({Signup:!0})},a.state={Signup:!1},a.loginSubmit=a.loginSubmit.bind(Object(g.a)(Object(g.a)(a))),a.signupSubmit=a.signupSubmit.bind(Object(g.a)(Object(g.a)(a))),a.formButton=a.formButton.bind(Object(g.a)(Object(g.a)(a))),a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e,t="formTab",a="formTab active";return this.state.Signup?(e=r.a.createElement(O,{signupSubmit:this.signupSubmit}),t="formTab active",a="formTab"):(e=r.a.createElement(v,{loginSubmit:this.loginSubmit}),t="formTab",a="formTab active"),r.a.createElement("div",{className:"homepageContainer"},r.a.createElement("button",{id:"logintabButton",className:a,onClick:this.formButton},"Sign in"),r.a.createElement("button",{id:"signuptabButton",className:t,onClick:this.formButton},"Sign up"),r.a.createElement("div",{className:"formsAndMore"},e),r.a.createElement("div",null))}}]),t}(n.Component),y=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("div",null,"LOL")}}]),t}(n.Component),S=function(e){function t(e){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).call(this,e))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"componentDidMount",value:function(){window.alert("Mounted"),b.a.post("/api/getracepartcipation").then(function(e){console.log(e)})}},{key:"render",value:function(){return r.a.createElement("div",{className:"standardContainer"},r.a.createElement("div",{className:"activeRaces"},r.a.createElement(y,null)))}}]),t}(n.Component),C=(a(217),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("tr",null,r.a.createElement("td",null,this.props.firstname," ",this.props.lastname),r.a.createElement("td",null,this.props.team),r.a.createElement("td",null,this.props.stagescore),r.a.createElement("td",null,this.props.teamscore),r.a.createElement("td",null,this.props.totalscore))}}]),t}(n.Component)),k=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("tr",null,r.a.createElement("td",null,this.props.username),r.a.createElement("td",null,this.props.stagescore),r.a.createElement("td",null,this.props.totalscore))}}]),t}(n.Component),N=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=[];return this.props.userTeamResult.forEach(function(t){e.push(r.a.createElement(C,{firstname:t.firstname,lastname:t.lastname,team:t.team,stagescore:t.stagescore,teamscore:t.teamscore,totalscore:t.totalscore}))}),r.a.createElement("table",{className:"scoreTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null,"Name"),r.a.createElement("th",null,"Team"),r.a.createElement("th",null,"StageScore"),r.a.createElement("th",null,"TeamScore"),r.a.createElement("th",null,"Total"))),r.a.createElement("tbody",null,e))}}]),t}(n.Component),T=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=[];return this.props.userScores.forEach(function(t){e.push(r.a.createElement(k,{username:t.username,stagescore:t.stagescore,totalscore:t.totalscore}))}),r.a.createElement("table",{className:"pouleTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null,"Username"),r.a.createElement("th",null,"Stagescore"),r.a.createElement("th",null,"Totalscore"))),r.a.createElement("tbody",null,e))}}]),t}(n.Component),R=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={mode:"",race:"classics",year:"2019",stage:a.props.match.params.stagenumber,userTeamResult:[],userScores:[]},a.previousStage=a.previousStage.bind(Object(g.a)(Object(g.a)(a))),a.nextStage=a.nextStage.bind(Object(g.a)(Object(g.a)(a))),a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"updateData",value:function(e){var t=this,a=this.state.race,n=this.state.year;console.log(e),b.a.post("/api/getstageresultsclassics",{race:a,year:n,stageNumber:e}).then(function(e){"404"===e.data.mode?t.setState({mode:"404"}):t.setState({mode:"",userTeamResult:e.data.teamresult,userScores:e.data.userscores})})}},{key:"previousStage",value:function(){var e=this.state.stage;this.props.history.push("/stage/"+(parseInt(e)-1).toString()),this.setState({stage:(parseInt(e)-1).toString()}),this.updateData((parseInt(e)-1).toString())}},{key:"nextStage",value:function(){var e=this.state.stage;this.props.history.push("/stage/"+(parseInt(e)+1).toString()),this.setState({stage:(parseInt(e)+1).toString()}),this.updateData((parseInt(e)+1).toString())}},{key:"componentDidMount",value:function(){this.updateData(this.state.stage)}},{key:"render",value:function(){var e,t,a;return"404"===this.state.mode?(e=r.a.createElement("h3",null,"404: Data not found"),t="",a=""):(e=r.a.createElement("h3",null),t=r.a.createElement(N,{userTeamResult:this.state.userTeamResult}),a=r.a.createElement(T,{userScores:this.state.userScores})),r.a.createElement("div",{className:"standardContainer"},r.a.createElement("button",{id:"previousStageButton",onClick:this.previousStage},"Previous Stage"),r.a.createElement("button",{id:"nextStageButton",onClick:this.nextStage},"Next Stage"),e,t,a)}}]),t}(n.Component),w=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"classicsSelectionFormContainer"},r.a.createElement("form",{action:"",onSubmit:this.props.fetchRider},r.a.createElement("div",{className:"pcsForm"},r.a.createElement("input",{className:"riderFormTextbox",name:"pcsid",ref:"pcsid",placeholder:"Enter PCS ID"}),r.a.createElement("button",{className:"riderSubmitButton"},"Find \u25b6"))),r.a.createElement("div",{className:this.props.errorClass},this.props.errorText))}}]),t}(n.Component),B=function(e){function t(){var e,a;Object(c.a)(this,t);for(var n=arguments.length,r=new Array(n),i=0;i<n;i++)r[i]=arguments[i];return(a=Object(o.a)(this,(e=Object(u.a)(t)).call.apply(e,[this].concat(r)))).removeRider=function(){a.props.removeRider(a.props.riderID)},a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this;return r.a.createElement("button",{className:this.props.selected,onClick:function(){return e.removeRider(e.props.riderID)}},"Remove Rider")}}]),t}(n.Component),I=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this.props;return r.a.createElement("tr",null,r.a.createElement("td",null,e.firstname," ",e.lastname),r.a.createElement("td",null,e.team),r.a.createElement("td",null,e.price),r.a.createElement("td",null,r.a.createElement(B,{removeRider:this.props.removeRider,riderID:this.props.riderID})))}}]),t}(n.Component),x=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this,t=[];return console.log(this.props.selection),this.props.selection.map(function(a){var n=a.firstname,i=a.lastname,s=a.team,c=a.price,l=a.rider_participation_id;t.push(r.a.createElement(I,{firstname:n,lastname:i,team:s,price:c,key:l,riderID:l,removeRider:e.props.removeRider}))}),r.a.createElement("table",{className:"userTeam"},r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null,"Name"),r.a.createElement("th",null,"Team"),r.a.createElement("th",null,"Price"),r.a.createElement("th",null))),r.a.createElement("tbody",null,t))}}]),t}(n.Component),_=(a(219),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("table",{className:"finances"},r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("td",null,"Finances"),r.a.createElement("td",null))),r.a.createElement("tbody",null,r.a.createElement("tr",null,r.a.createElement("td",null,"Budget"),r.a.createElement("td",null,": \u20ac",this.props.budget)),r.a.createElement("tr",null,r.a.createElement("td",null,"Riders to pick"),r.a.createElement("td",null,": ",20-this.props.teamsize)),r.a.createElement("tr",null,r.a.createElement("td",null,"Average"),r.a.createElement("td",null,": \u20ac",this.props.budget/(20-this.props.teamsize)))))}}]),t}(n.Component)),D=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"ridercard"},r.a.createElement("img",{src:this.props.rider.imageURL,className:"riderImage",alt:"riderimage"}),r.a.createElement("select",{className:"riderPrice",onChange:this.props.changePrice},r.a.createElement("option",{value:"500000"},"500,000"),r.a.createElement("option",{value:"750000"},"750,000"),r.a.createElement("option",{value:"1000000"},"1,000,000"),r.a.createElement("option",{value:"1500000"},"1,500,000"),r.a.createElement("option",{value:"2000000"},"2,000,000"),r.a.createElement("option",{value:"2500000"},"2,500,000"),r.a.createElement("option",{value:"3000000"},"3,000,000"),r.a.createElement("option",{value:"3500000"},"3,500,000"),r.a.createElement("option",{value:"4000000"},"4,000,000"),r.a.createElement("option",{value:"5000000"},"5,000,000"),r.a.createElement("option",{value:"6000000"},"6,000,000")),r.a.createElement("ul",null,r.a.createElement("li",null,"Name: ",this.props.rider.firstName," ",this.props.rider.lastName),r.a.createElement("li",null,"Age: ",this.props.rider.age),r.a.createElement("li",null,"Team: ",this.props.rider.team),r.a.createElement("li",null,"Country: ",this.props.rider.countryFullname)),r.a.createElement("button",{className:this.props.buttonClass,onClick:this.props.selectRider},this.props.buttonText))}}]),t}(n.Component),L=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).fetchRider=function(e){e.preventDefault();var t=e.target.pcsid.value.split("/").pop();a.setState({buttonClass:"riderSelectButton",buttonText:"Fetching.."}),b.a.post("/api/getrider",{pcsid:t}).then(function(e){!1===e.data?a.setState({errorClass:"errorDiv",errorText:"Rider could not be found",buttonText:"Nothing to add"}):a.setState({rider:e.data.rider,buttonClass:"riderSelectButton active",buttonText:"Add rider to team",errorClass:"",errorText:""})})},a.state={userSelection:[{firstname:"",lastname:"",price:0,team:"",rider_participation_id:""}],race:"classics",year:"2019",budget:0,rider:{firstName:"",lastName:"",team:"",age:"",country:"",imageURL:"/images/blankProfilePicture.png",pcsid:"",countryFullname:""},price:5e5,buttonClass:"riderSelectButton",buttonText:"Nothing to add",errorClass:"",errorText:""},a.fetchRider=a.fetchRider.bind(Object(g.a)(Object(g.a)(a))),a.selectRider=a.selectRider.bind(Object(g.a)(Object(g.a)(a))),a.removeRider=a.removeRider.bind(Object(g.a)(Object(g.a)(a))),a.changePrice=a.changePrice.bind(Object(g.a)(Object(g.a)(a))),a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"selectRider",value:function(){var e=this,t=this.state.rider,a=this.state.race,n=this.state.year,r=this.state.price,i=this.state.pcsid;this.setState({buttonClass:"riderSelectButton",buttonText:"Adding.."}),b.a.post("/api/teamselectionaddclassics",{pcsid:i,race:a,year:n,rider:t,price:r}).then(function(a){if(a){var n=e.state.userSelection;console.log(t),n.unshift({firstname:t.firstName,lastname:t.lastName,price:r,team:t.team,rider_participation_id:a.riderID}),console.log(n),e.setState({userSelection:n,budget:e.state.budget-r,buttonClass:"riderSelectButton active",buttonText:"Add rider to team"})}})}},{key:"removeRider",value:function(e){var t=this,a=this.state.race,n=this.state.year;this.setState({buttonClass:"riderSelectButton",buttonText:"Removing.."}),b.a.post("/api/teamselectionremove",{rider_participation_id:e,race:a,year:n}).then(function(a){if(a){for(var n=t.state.userSelection,r=0;r<n.length;r++)n[r].rider_participation_id===e&&n.splice(r);t.setState({userSelection:n,buttonClass:"riderSelectButton active",buttonText:"Add rider to team"})}})}},{key:"componentDidMount",value:function(){var e=this,t=this.state.race,a=this.state.year;b.a.post("/api/getuserteamselection",{race:t,year:a}).then(function(t){e.setState({riders:t.data.allRiders,userSelection:t.data.userSelection,budget:t.data.budget})})}},{key:"changePrice",value:function(e){this.setState({price:e.target.value})}},{key:"render",value:function(){var e=this.state.budget,t=this.state.userSelection.length,a=this.state.buttonClass,n=this.state.buttonText;return r.a.createElement("div",{className:"teamselectionContainer"},r.a.createElement("div",{className:"riderformcontainer"},r.a.createElement(w,{fetchRider:this.fetchRider,errorClass:this.state.errorClass,errorText:this.state.errorText}),r.a.createElement(D,{rider:this.state.rider,selectRider:this.selectRider,buttonClass:a,buttonText:n,changePrice:this.changePrice}),r.a.createElement(_,{teamsize:t,budget:e})),r.a.createElement("div",{className:"usertablecontainer"},r.a.createElement(x,{selection:this.state.userSelection,removeRider:this.removeRider})))}}]),t}(n.Component),P=(a(221),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this.props.output,t=[],a=[],n=[];if(e.length>0){Object.keys(e[0]).forEach(function(e){t.push(r.a.createElement("th",null,e))});for(var i=0;i<e.length;i++){for(var s in e[i])a.push(r.a.createElement("td",null,e[i][s]));n.push(r.a.createElement("tr",null,a)),a=[]}}return r.a.createElement("table",{className:"outputTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,t)),r.a.createElement("tbody",null,n))}}]),t}(n.Component)),A=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).submitQuery=function(e){e.preventDefault(),b.a.post("/api/admin",{query:a.state.value}).then(function(e){a.setState({output:e.data.data})})},a.state={output:[],value:""},a.submitQuery=a.submitQuery.bind(Object(g.a)(Object(g.a)(a))),a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a.testButton=a.testButton.bind(Object(g.a)(Object(g.a)(a))),a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(e){this.setState({value:e.target.value})}},{key:"testButton",value:function(e){this.setState({value:e.target.value})}},{key:"render",value:function(){return r.a.createElement("div",{className:"adminpageContainer"},r.a.createElement("div",null,r.a.createElement("form",{action:"",onSubmit:this.submitQuery,id:"queryform"},r.a.createElement("textarea",{className:"queryInputBox",rows:"12",cols:"80",value:this.state.value,onChange:this.handleChange}),r.a.createElement("input",{type:"submit",value:"submit"})),r.a.createElement("button",{onClick:this.testButton,value:"SELECT * FROM account",className:"queryButton"},"Get all accounts"),r.a.createElement("button",{onClick:this.testButton,value:"SELECT race_id FROM race WHERE name = '' AND year = ''",className:"queryButton"},"Get race ID"),r.a.createElement("button",{onClick:this.testButton,value:"SELECT rider.firstname || ' ' || rider.lastname as name, price, team, rider_participation_id FROM rider_participation INNER JOIN rider using(rider_id) WHERE race_id = ${race_id}",className:"queryButton"},"Get all riders"),r.a.createElement("div",{className:"outputTableContainer"},r.a.createElement(P,{output:this.state.output}))))}}]),t}(n.Component),z=(a(223),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this.props.stagerankings,t=[],a=[],n=[];if(e.length>0){Object.keys(e[0]).forEach(function(e){t.push(r.a.createElement("th",null,e))});for(var i=0;i<e.length;i++){for(var s in e[i])a.push(r.a.createElement("td",null,e[i][s]));n.push(r.a.createElement("tr",null,a)),a=[]}}return r.a.createElement("table",{className:"winnaarsTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,t)),r.a.createElement("tbody",null,n))}}]),t}(n.Component)),F=function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this.props.rankingscount,t=[],a=[],n=[];if(e.length>0){Object.keys(e[0]).forEach(function(e){t.push(r.a.createElement("th",null,e))});for(var i=0;i<e.length;i++){for(var s in e[i])a.push(r.a.createElement("td",null,e[i][s]));n.push(r.a.createElement("tr",null,a)),a=[]}}return r.a.createElement("table",{className:"winnaarsTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,t)),r.a.createElement("tbody",null,n))}}]),t}(n.Component),M=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={stagerankings:[],rankingscount:[]},a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"componentWillMount",value:function(){var e=this;b.a.post("/api/getstagevictories",{race_id:4,poule_id:0}).then(function(t){t&&(console.log("DATA",t.data),e.setState({stagerankings:t.data.stagerankings,rankingscount:t.data.rankingscount}),console.log("STATE:",e.state))})}},{key:"render",value:function(){return r.a.createElement("div",{className:"etappewinstenContainer"},r.a.createElement("div",null,"Etappe Uitslagen"),r.a.createElement(z,{stagerankings:this.state.stagerankings}),r.a.createElement("div",null,"Hoe vaak welke positie"),r.a.createElement(F,{rankingscount:this.state.rankingscount}))}}]),t}(n.Component),W=(a(225),function(e){function t(){return Object(c.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){var e=this.props.overzicht,t=this.props.teamselection2.map(function(e){return e.rider_participation_id}),a=[],n=[],i=[];if(e.length>0){Object.keys(e[0]).forEach(function(e){"rider_participation_id"!==e&&a.push(r.a.createElement("th",null,e))});for(var s=0;s<e.length;s++){for(var c in e[s])"rider_participation_id"!==c&&n.push(r.a.createElement("td",null,e[s][c]));t.includes(e[s].rider_participation_id)?i.push(r.a.createElement("tr",{className:"inteam"},n)):i.push(r.a.createElement("tr",null,n)),n=[]}}return r.a.createElement("table",{className:"ScoreTable"},r.a.createElement("thead",null,r.a.createElement("tr",null,a)),r.a.createElement("tbody",null,i))}}]),t}(n.Component)),q=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={overzicht:[],teamselection:[]},a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"componentWillMount",value:function(){var e=this;b.a.post("/api/getallriderpoints",{race_id:4,poule_id:0}).then(function(t){t&&e.setState({overzicht:t.data.overzicht,teamselection:t.data.teamselection})})}},{key:"render",value:function(){return r.a.createElement("div",{className:"overzichtContainer"},r.a.createElement("div",null,"Etappe Uitslagen"),r.a.createElement(W,{overzicht:this.state.overzicht,teamselection2:this.state.teamselection}))}}]),t}(n.Component),U=function(e){function t(e){var a;return Object(c.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={isLoggedIn:!1},a}return Object(m.a)(t,e),Object(l.a)(t,[{key:"componentWillMount",value:function(){var e=this;b.a.post("api/isloggedin",{withCredentials:!0}).then(function(t){e.state.isLoggedIn!==t.data&&e.setState({isLoggedIn:t.data}),e.state.isLoggedIn||"/"===e.props.history.location.pathname||e.props.history.replace("/")})}},{key:"render",value:function(){var e=this;return b.a.post("api/isloggedin",{withCredentials:!0}).then(function(t){e.state.isLoggedIn!==t.data&&e.setState({isLoggedIn:t.data}),e.state.isLoggedIn||"/"===e.props.history.location.pathname||e.props.history.replace("/")}).catch(function(e){throw e}),r.a.createElement("div",{className:"content"},r.a.createElement("div",{className:"backgroundImage"}),r.a.createElement(f,{isLoggedIn:this.state.isLoggedIn}),r.a.createElement("div",{className:"pageContainer"},r.a.createElement(p.a,{exact:!0,path:"/",render:function(){return e.state.isLoggedIn?r.a.createElement(h.a,{to:"/stage/1"}):r.a.createElement(j,{history:e.props.history})}}),r.a.createElement(p.a,{path:"/profile",component:S,history:this.props.history}),r.a.createElement(p.a,{path:"/stage/:stagenumber",component:R,history:this.props.history}),r.a.createElement(p.a,{path:"/teamselection",component:L,history:this.props.history}),r.a.createElement(p.a,{path:"/admin",component:A,history:this.props.history}),r.a.createElement(p.a,{path:"/etappewinsten",component:M,history:this.props.history}),r.a.createElement(p.a,{path:"/overzicht",component:q,history:this.props.history})))}}]),t}(n.Component),Q=a(235);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var G=a(103),H=a.n(G)()();s.a.render(r.a.createElement(Q.a,{history:H},r.a.createElement(U,{history:H})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},95:function(e,t,a){}},[[104,2,1]]]);
//# sourceMappingURL=main.4301265c.chunk.js.map