import React, { Component } from 'react';
import logo from '../logo.png';
import { Buffer } from 'buffer';
import './App.css';
import Web3 from 'web3';
import Meme from '../abis/Meme.json';
const ipfsClient = require('ipfs-http-client');

const projectId = '2F7L3MQSD4KIBReoaegI7VEsvbV';
const projectSecret = '88390a04e6f98e147b1432f1ec4b1d13';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfs = ipfsClient({
   host: 'ipfs.infura.io',
   port: 5001, 
   protocol: 'https',
   headers: {
    authorization: auth,
  }
  })

class App extends Component {
 
  async componentWillMount(){
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData(){
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({account: accounts[0]});
    const networkId = await web3.eth.net.getId();
    const networkData = Meme.networks[networkId];
    if(networkData){
      const abi = Meme.abi;
      const address = networkData.address;
      const contract = web3.eth.Contract(abi, address);
      this.setState({contract});
      // Get file on blockchain
      const memeHash = await contract.methods.get().call();
      this.setState({memeHash});
    }else{
      window.alert('Smart contract not deployed to detected network!')
    }
  }

  constructor(props){
    super(props);
    this.state = {
      account: '',
      buffer: null,
      contract: null,
      memeHash: "QmPDF25qQh9GD4X6q4BwxePvv7E2sFkPgkZ2CaWPjGWByJ"
    };
  }

  async loadWeb3(){
    if(window.ethereum){
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }if(window.web3){
      window.web3 = new Web3(window.web3.currentProvider);
    }else {
      window.alert('Please use metamask!');
    }
  }

  onSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting the form...')
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      const memeHash = result[0].hash;
      this.setState({memeHash})
      if(error){
        console.error(error)
        return;
      }
      // Store file on blockchain...
      this.state.contract.methods.set(memeHash)
      .send({from: this.state.account}).then((r) => {
        this.setState({memeHash});
      })
      
    })
  }

  captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)});
    }
  }
  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meme of the day
          </a>
          <ul className='navbar-nav px-3'>
            <li className='nav-item text-nowrap d-node d-sm-none d-sm-block'>
              <small className='text-white'>{this.state.account}</small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                  {/* <img src={logo} className="App-logo" alt="logo" /> */}
                  <img src={`https://mem-test.infura-ipfs.io/ipfs/${this.state.memeHash}`} className="App-logo" alt="logo" />
                  <p>&nbsp;</p>
                  <h2>Change Meme</h2>
                <form onSubmit={this.onSubmit}>
                  <input type='file' onChange={this.captureFile}></input>
                  <input type='submit'></input>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
