/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { useMagic } from '../../magic/MagicProvider'; 
import { abi } from '../../json_abi/Greeter.json';
import { ethers } from 'ethers';
import styles from './SellCard.module.css';
import Spinner from '@/components/ui/Spinner'; 

// Dashboard Component
const Dashboard = () => {
  return (
    <div className="home-page">
      <div className="cards-container">
        <MintPage />
      </div>
    </div>
  );
};

// MintPage Component
const MintPage = () => {
  const { magic, web3 } = useMagic();
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLogged, setDataLogged] = useState(false); // New state variable

  const GREETER_CONTRACT_ADDRESS = '0xEFDe655279C1b02CA25C1226F10cdb8B8260e88d';

  useEffect(() => {
    const initContract = async () => {
      if (web3) {
        const contractInstance = new web3.eth.Contract(abi, GREETER_CONTRACT_ADDRESS);
        setContract(contractInstance);

        if (!dataLogged) { // Check if data has already been logged
          try {
            const tokenId = await contractInstance.methods._nextTokenId().call();
            setTokenId(tokenId);
            console.log('tokenId', tokenId);
          } catch (error) {
            console.error('Error fetching tokenId:', error);
          }

          try {
            const latestBlock = await web3.eth.getBlock('latest');
            console.log('Latest block:', latestBlock);
          } catch (error) {
            console.error('Error fetching the latest block:', error);
          }

          setDataLogged(true); // Set the state to true after logging
        }
      }
    };

    initContract();
  }, [web3, dataLogged]); // Add dataLogged to dependency array

  const Mint = async () => {
    setLoading(true);
    try {
      const currentBlock = await web3.eth.getBlock('latest');
      if (!currentBlock) throw new Error('Failed to fetch current block');

      const deadlineNum = Number(currentBlock.timestamp) + 100000;
      const deadline = ethers.BigNumber.from(deadlineNum.toString());
      console.log('Deadline:', deadline.toString());

      const msgParams = JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Minting: [
            { name: 'deadline', type: 'uint' },
          ],
        },
        primaryType: 'Minting',
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: '80002',
          verifyingContract: GREETER_CONTRACT_ADDRESS,
        },
        message: {
          deadline: deadline.toString(),
        },
      });

      console.log('Message Params:', msgParams);

      const userMetadata = await magic?.user.getMetadata();
      const userPublicAddress = userMetadata?.publicAddress;
      console.log('User Public Address:', userPublicAddress);

      const signature = await magic?.rpcProvider.request({
        method: 'eth_signTypedData_v4',
        params: [userPublicAddress, msgParams],
      });

      console.log('Signature:', signature);

      await relayMinting(userPublicAddress, signature, deadline.toString());
    } catch (error) {
      console.error('Error in Mint function:', error);
    } finally {
      setLoading(false);
    }
  };

  const relayMinting = async (userPublicAddress: string | null | undefined, signature: string, deadline: string) => {
    const v = parseInt(signature.slice(130, 132), 16);
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);

    const url = `http://localhost:8080/relayMint?greetingDeadline=${deadline}&greetingSender=${userPublicAddress}&v=${v}&r=${r}&s=${s}`;
    console.log('Relay Request URL:', url);

    fetch(url, {
      method: 'GET',
      headers: new Headers(),
      mode: 'cors',
      cache: 'default',
    })
      .then(response => response.json())
      .then(data => {
        console.log('Response from server:', data);
      })
      .then(()=>setShowPopup(true))
      .catch(error => {
        console.error('Error in fetch request:', error);
      });
  };

  const Popup = () => (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <h2>Success!</h2>
        <p>Your ticket has been successfully purchased.</p>
        <p>You can view your ticket in this app:</p>
        <img src="https://play-lh.googleusercontent.com/4BGJp8OnyC2bhxGVtekbRU0uU00zJb2xP2LRupVgVDXzcE8A7_G2TQWOb1MFcH02z9Am=w240-h480-rw" alt="Tocon App" className={styles.appImage} />
        <div className={styles.storeLogos}>
          <a href="https://play.google.com/store/apps/details?id=com.tocon&hl=en_US&pli=1" target="_blank" rel="noopener noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play Store" className={styles.storeLogo} />
          </a>
          <a href="https://apps.apple.com/app/id6448629728" target="_blank" rel="noopener noreferrer">
            <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className={styles.storeLogo} />
          </a>
        </div>
        <button onClick={() => setShowPopup(false)}>Close</button>
      </div>
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h2 className={styles.header}>Get Your Ticket Now!!!</h2>
        <p className={styles.description}>This is a brief description of the product.</p>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="cardNumber">Credit Card Number</label>
            <input type="text" id="cardNumber" name="cardNumber" placeholder="4242 4242 4242 4242" required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cardValidity">Card Validity</label>
            <input type="text" id="cardValidity" name="cardValidity" placeholder="MM/YY" required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cvv">CVV</label>
            <input type="text" id="cvv" name="cvv" placeholder="123" required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cardHolder">Card Holder Full Name</label>
            <input type="text" id="cardHolder" name="cardHolder" placeholder="John Doe" required />
          </div>
          <div className={styles.footer}>
            <span className={styles.price}>$29.99</span>
            {loading ? (<Spinner />) : (<button className={styles.button} onClick={Mint}>Buy Now</button>)}
            <div className={styles.logoContainer}>  
              <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" />
              <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" />
              <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" />
            </div>
          </div>
        </form>
      </div>
      {showPopup && <Popup />}
    </div>
  );
};

export default Dashboard;
