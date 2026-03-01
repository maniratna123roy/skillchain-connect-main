'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideTop = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-70px) rotate(90deg); }
  60% { transform: translateY(-70px) rotate(90deg); }
  100% { transform: translateY(-8px) rotate(90deg); }
`;

const slidePost = keyframes`
  50% { transform: translateY(0); }
  100% { transform: translateY(-70px); }
`;

const fadeInFwd = keyframes`
  0% { opacity: 0; transform: translateY(-5px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const StyledWrapper = styled.div`
  .container {
    background-color: #1e1e2f;
    display: flex;
    width: 320px;
    height: 100px;
    position: relative;
    border-radius: 12px;
    transition: 0.3s ease-in-out;
    border: 2px solid #3b82f6;
    box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.5);
    overflow: hidden;
    cursor: default;
  }

  /* Auto-animate on mount */
  .container {
    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  }

  @keyframes bounce-in {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .left-side {
    background-color: #3b82f6;
    width: 100px;
    height: 100px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    flex-shrink: 0;
    overflow: hidden;
  }

  .right-side {
    width: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 16px;
    background-color: #1e1e2f;
  }

  .new {
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
  }

  .sub-text {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 4px;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card {
    width: 60px;
    height: 40px;
    background-color: #93c5fd;
    border-radius: 6px;
    position: absolute;
    display: flex;
    z-index: 10;
    flex-direction: column;
    align-items: center;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
    animation: ${slideTop} 2s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
  }

  .card-line {
    width: 50px;
    height: 10px;
    background-color: #60a5fa;
    border-radius: 2px;
    margin-top: 6px;
  }

  .buttons {
    width: 6px;
    height: 6px;
    background-color: #1e40af;
    box-shadow: 0 -8px 0 0 #1e3a8a, 0 8px 0 0 #3b82f6;
    border-radius: 50%;
    margin: 8px 0 0 -25px;
    transform: rotate(90deg);
  }

  .post {
    width: 55px;
    height: 65px;
    background-color: #4b5563;
    position: absolute;
    z-index: 11;
    bottom: 5px;
    border-radius: 6px;
    overflow: hidden;
    animation: ${slidePost} 2s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
  }

  .post-line {
    width: 40px;
    height: 8px;
    background-color: #1f2937;
    position: absolute;
    border-radius: 0 0 3px 3px;
    right: 7.5px;
    top: 8px;
  }

  .post-line:before {
    content: "";
    position: absolute;
    width: 40px;
    height: 8px;
    background-color: #374151;
    top: -8px;
  }

  .screen {
    width: 40px;
    height: 20px;
    background-color: #e5e7eb;
    position: absolute;
    top: 20px;
    right: 7.5px;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dollar {
    font-size: 14px;
    font-weight: bold;
    color: #3b82f6;
    animation: ${fadeInFwd} 0.3s 1s backwards infinite;
  }

  .numbers {
    width: 10px;
    height: 10px;
    background-color: #6b7280;
    box-shadow: 0 -15px 0 0 #6b7280, 0 15px 0 0 #6b7280;
    border-radius: 2px;
    position: absolute;
    transform: rotate(90deg);
    left: 22px;
    top: 45px;
  }

  .numbers-line2 {
    width: 10px;
    height: 10px;
    background-color: #9ca3af;
    box-shadow: 0 -15px 0 0 #9ca3af, 0 15px 0 0 #9ca3af;
    border-radius: 2px;
    position: absolute;
    transform: rotate(90deg);
    left: 22px;
    top: 58px;
  }
`;

interface TransactionNotificationProps {
    title: string;
    message: string;
}

const TransactionNotification: React.FC<TransactionNotificationProps> = ({ title, message }) => {
    return (
        <StyledWrapper>
            <div className="container">
                <div className="left-side">
                    <div className="card">
                        <div className="card-line" />
                        <div className="buttons" />
                    </div>
                    <div className="post">
                        <div className="post-line" />
                        <div className="screen">
                            <div className="dollar">✓</div>
                        </div>
                        <div className="numbers" />
                        <div className="numbers-line2" />
                    </div>
                </div>
                <div className="right-side">
                    <div className="new">{title}</div>
                    <div className="sub-text">{message}</div>
                </div>
            </div>
        </StyledWrapper>
    );
};

export default TransactionNotification;
