
// $.ajax({ url: 'https://api.instagram.com/v1/media/?access_token=4654651.901712a.996c8b53ab60433fa33771aa6cdc188f', method: 'get',dataType: "jsonp", success: printObject, error: printObject  }).done(printObject)
// import * from 'js/react-bootstrap';
var Button = ReactBootstrap.Button
var Row = ReactBootstrap.Row

/**
 * @class IgLogin - Displays login button.
 *
 * @prop appId - Facebook issued application ID
 * @prop loginStatus - callback when login status changes (logged in or out)
 *			@param login object: login response object
 */
class IgLogin extends React.Component {
	constructor(props) {
		super(props)
		this.state = { loggedIn: false }
	}

	componentDidMount() {
		console.log('IgLogin.componentDidMount()', this, window.location.hash);
		this.loginStatus()
	}

	loginStatus() {
		const loginHash='#'
		let login=this.state.loggedIn;
		if (window.location.hash && window.location.hash.substring(0,14) === '#access_token=') {
			login = window.location.hash.substring(14)
			window.location.hash=loginHash // Hide visibility of access_token in URL
		}
		else if (window.location.hash && window.location.hash.substring(0,loginHash.length) === loginHash ) {
			0; // nop
		}
		else {
			login=false
		}
		if (login != this.state.loggedIn && this.props.loginStatus && typeof this.props.loginStatus === 'function')
			this.props.loginStatus(login)
		this.setState({loggedIn: login})
	}

	handleLogin(e) {
		console.log('IgLogin.handleLogin()',e,this)
		let redirect_uri=window.location.origin+window.location.pathname
		if (this.state.loggedIn) {
			// https://instagram.com/accounts/logout
			$.ajax({
				url: 'https://instagram.com/accounts/logout',
				method: 'get',
				jsonp: true,
				dataType: "text"
			}).done(response => { printObject(response); this.setState({loggedIn: false}); window.location.replace(redirect_uri) })
			  .fail(response => { console.log(response); this.setState({loggedIn: false}); window.location.replace(redirect_uri) })
		}
		else {
			let scope='public_content'
			window.location.replace(`https://instagram.com/oauth/authorize/?client_id=${this.props.appId}&redirect_uri=${redirect_uri}&response_type=token&scope=${scope}`)
		}
	} // handleLogin()

	render() {
		console.log('IgLogin.render()',this)
		return (
			<Button
				className={this.props.className ? this.props.className : ''}
				bsStyle="default"
				onClick={this.handleLogin.bind(this)}
				block
			>
				{this.state.loggedIn ? 'Logout' : 'Login'}
			</Button>
		)
	} // render()
} // IgLogin

var FormGroup = ReactBootstrap.FormGroup;
var FormControl = ReactBootstrap.FormControl;
var Modal = ReactBootstrap.Modal;
var OverlayTrigger = ReactBootstrap.OverlayTrigger;

/**
 * @class DoPost -
 */
class DoPost extends React.Component {
	constructor(props) {
		super(props)
		this.state = { showModal: false, message: '' }
		this.open = this.open.bind(this)
		this.close = this.close.bind(this)
	}

	close(e) {
		if (e.target.name == 'draft' || e.target.name == 'publish' ) {
			FB.api(this.props.pageInfo.id+'/feed','POST',
					{
						access_token: this.props.pageInfo.access_token,
						published: e.target.name == 'publish',
						message: this.state.message
					},
					(result) => { printObject(result); this.setState({showModal: false}) } )
		}
		else if (e.target.name == 'scheduled') {
			FB.api(this.props.pageInfo.id+'/feed','POST',
					{
						access_token: this.props.pageInfo.access_token,
						scheduled_publish_time: parseInt(new Date().getTime() /1000) +3600,
						published: false,
						message: this.state.message
					},
					(result) => { printObject(result); this.setState({showModal: false}) } )
		}
		else
			this.setState({ showModal: false })
	}

	open() {
		this.setState({ showModal: true, message: '' })
	}

	handleMessage(e) {
		this.setState({message: e.target.value})
	}

	render() {
		return (
       <div>
         <Button
           bsStyle={this.props.className}
			  disabled={this.props.disabled}
           onClick={this.open}
			  block
         >
           {this.props.children}
         </Button>

         <Modal id='post-dialog' show={this.state.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Publish Page Post</Modal.Title>
				</Modal.Header>
				<Modal.Body>
						<FormControl
							componentClass="textarea"
				         value={this.state.message}
				         onChange={this.handleMessage.bind(this)} />
				</Modal.Body>
				<Modal.Footer>
					<Button bsStyle='default' disabled={this.state.message === ''} name='scheduled' onClick={this.close}>Pub in 1 hr</Button>
					<Button bsStyle='primary' disabled={this.state.message === ''} name='draft' onClick={this.close}>Submit Draft</Button>
					<Button bsStyle='success' disabled={this.state.message === ''} name='publish' onClick={this.close}>Publish Now</Button>
				</Modal.Footer>
         </Modal>
       </div>
	   )
	} // DoPost.render()
} // DoPost


/**
 * @class SidePanel - Manage control side of the UI
 * @prop string|array show - published and/or unpublished posts
 * @prop function loginStatus - New page selected
 * @prop function onLogout - Notification of logout
 */
class SidePanel extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			login: undefined,
			pageInfo: undefined
	 	}
	}
	loginChange(login) {
		console.log('SidePanel.loginChange()',login)
		if (typeof this.props.loginStatus === 'function')
			this.props.loginStatus(login)
		this.setState({login: login})
	}
	pageChange(pageinfo) {
		console.log('SidePanel.pageChange()', pageinfo)
		this.setState({pageInfo: pageinfo})
		if (typeof this.props.onPage === 'function') {
			this.props.onPage(pageinfo, this.state.login)
		}
	}
	render() {
		let noUser = (typeof this.state.login === 'undefined' || this.state.login.status != 'connected')
		let noPage = (typeof this.state.pageInfo === 'undefined')
		let pageId = (noPage ? 0 : this.state.pageInfo.id)
		console.log('SidePanel.render()', this.state.login, this.state.pageInfo, noUser, noPage, (typeof this.state.pageInfo))

		return (<div>
			<FormGroup>
					<IgLogin appId='901712a0a1a54ef5ada6bf52dffb6ef9' loginStatus={this.loginChange.bind(this)}/>
			</FormGroup>
			<FormGroup>
					<DoPost className='default' disabled={noPage} pageInfo={this.state.pageInfo}>Add Post</DoPost>
			</FormGroup>
		</div>)
	} // SidePanel.render()
} // class SidePanel

function PostNumber(props) {
	return (<div className='view-count'>{props.value}<div className='count-label'>{props.children}</div></div>)
}
function StatsNumber(props) {
	let counters='';
	let label='';
	if (props.comments > 0) {
		counters = props.comments
		label = 'Comments'
	}
	if (props.likes > 0) {
		if (counters) counters += '/'
		counters += props.likes
		if (label)
			label = [label+'/', 'Likes']
		else label = 'Likes'
	}
	return (<div className='view-count'><div className='number'>{counters}</div><div className='count-label'>{Array.isArray(label) ? label.map(value => (<span>{value}<br/></span>)) : label}</div></div>)
}

/**
 * @class IgPost -
 */
class IgPost extends React.Component {
	constructor(props) {
		super(props)
		this.state = {views: -1}
	}
	componentDidMount() {
		if (this.props.is_published)
			FB.api(this.props.id+'/insights/post_impressions',
			       {access_token: this.props.accessToken},
					 (data) => this.setState({views: data.data[0].values[0].value}) )
	}
	render() {
		console.log('IgPost.render()',this.props)
		let glyph = this.props.is_published
						? 'glyphicon glyphicon-ok'
						: 'glyphicon glyphicon-pencil'
// {this.props.comments.count > 0 ? (<PostNumber value={this.props.comments.count}>Comments</PostNumber>) : ''}
// {this.props.likes.count+this.props.comments.count > 0 ? (<StatsNumber likes={this.props.likes.count} comments={this.props.comments.count}/>) : ''}
		return (
			<div className='fbpost'>
				<img src={this.props.images.thumbnail.url}/>
				{this.props.likes.count > 0 ? (<PostNumber value={this.props.likes.count}>Likes</PostNumber>) : ''}
				{this.props.caption ? <div className='message'>{this.props.caption.text}</div> : ''}
		</div>)
	} // IgPost.render()
} // IgPost

var Pager = ReactBootstrap.Pager
// var PagerItem = ReactBootstrap.PagerItem
/**
 * @class IgMore - Load more
 * 	@prop loadMore
 */
class IgMore extends React.Component {
	constructor(props) {
		super(props)
		// this.state = { }
	}
	doMore() {
		if (this.props.onLoad && typeof this.props.onLoad === 'function') {
			$.ajax({
				url: this.props.pagination.next_url,
				data: {
					max_id: this.props.pagination.next_pax_id,
					access_token: this.props.accessToken,
//					count: 5
				},
				method: 'get',
				dataType: "jsonp"
			}).done(this.props.onLoad).fail(printObject)
		}
	}
	render() {
      return (
			<Pager
				onSelect={this.doMore.bind(this)}
			>
				<Pager.Item>More&hellip;</Pager.Item>
			</Pager>
		)
	} // IgMore.render()
} // IgMore

/**
 * @class IgPosts -
 */
class IgPosts extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			userInfo: {},
			posts: [],
			pagination: {}
		}
		console.log('IgPosts()',props)
		if (typeof props.userInfo !== 'undefined')
			this.state.userInfo = props.userInfo

		this.loadPostsList = this.loadPostsList.bind(this)
	}
	componentDidMount() {
		if ( this.props.userInfo ) {
			console.log('IgPosts.componentDidMount()',this.props.userInfo)
		}
	}

	loadPostsList(data) {
		console.log('IgPosts.loadPostsList()',data)
//		printObject(data)
		this.setState( {posts: this.state.posts.concat(data.data), pagination: data.pagination} )
	}

	componentWillReceiveProps(nextProps) {
		console.log('IgPosts.componentWillReceiveProps()',nextProps)
		let state={}
		let userInfo = nextProps.userInfo
		if (userInfo != this.props.userInfo) {
			state.posts = []	// If user info changed, new user, clear posts
		}
		state.userInfo = userInfo
		this.setState(state)
		$.ajax({
			url: 'https://api.instagram.com/v1/users/self/media/recent',
			data: {
				access_token: userInfo.access_token,
//				count: 5
			},
			method: 'get',
			dataType: "jsonp"
		}).done(this.loadPostsList).fail(printObject)
	}
	render() {
		console.log('IgPosts.render()',this.state.posts)
		let brief=this.props.brief ? 'brief' : '';
		return (<div className={brief}>
			{this.state.posts.length === 0
				? (<h5>{this.state.userInfo && this.state.userInfo.name
						? 'Posts for  "'+this.state.userInfo.name+'"'
						: 'No posts loaded'}</h5>)
				: ''}
			{this.state.posts.map(value => (<IgPost key={value.id} {...value} accessToken={this.props.userInfo.access_token}/>))}
			{this.state.pagination.next_url
				? <IgMore accessToken={this.props.userInfo.access_token} pagination={this.state.pagination} onLoad={this.loadPostsList}/>
				: ''}
			</div>
		)
	} // IgPosts.render()
} // IgPosts

var Col = ReactBootstrap.Col
/**
 *
 */
class AppContent extends React.Component {
	constructor(props) {
		super(props)
		this.state = { pageInfo: {}, userInfo: {} }
	}

	loginStatus(userInfo) {
		console.log('AppContent.loginStatus()',userInfo)
		this.setState({userInfo: { access_token: userInfo}})
	}

	render() {
		console.log('AppContent.render()')
		return (
			<Row>
				<Col className='side-bar' sm={3} xs={12}>
					<SidePanel loginStatus={this.loginStatus.bind(this)}/>
				</Col>
				<Col className='posts' sm={9} xs={12}>
					<IgPosts userInfo={this.state.userInfo}/>
				</Col>
			</Row>
		)
	} // AppContent.render()
} // AppContent
