'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideTop = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-45px) rotate(90deg); }
  60% { transform: translateY(-45px) rotate(90deg); }
  100% { transform: translateY(-5px) rotate(90deg); }
`;

const slidePost = keyframes`
  50% { transform: translateY(0); }
  100% { transform: translateY(-45px); }
`;

const fadeInFwd = keyframes`
  0% { opacity: 0; transform: translateY(-3px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const StyledWrapper = styled.div`
  .container {
    background-color: #1a1a1a;
    display: flex;
    width: 320px;
    height: 100px;
    position: relative;
    border-radius: 12px;
    transition: 0.3s ease-in-out;
    border: 2px solid #ef4444;
    box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.5);
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
    background: linear-gradient(135deg, #ef4444, #b91c1c);
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
    background-color: #1a1a1a;
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
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card {
    width: 60px;
    height: 40px;
    background-color: #f87171;
    border-radius: 6px;
    position: absolute;
    display: flex;
    z-index: 10;
    flex-direction: column;
    align-items: center;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
    animation: ${slideTop} 1.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  }

  .card-line {
    width: 50px;
    height: 10px;
    background-color: #fca5a5;
    border-radius: 2px;
    margin-top: 6px;
  }

  .buttons {
    width: 6px;
    height: 6px;
    background-color: #991b1b;
    box-shadow: 0 -8px 0 0 #7f1d1d, 0 8px 0 0 #ef4444;
    border-radius: 50%;
    margin: 8px 0 0 -25px;
    transform: rotate(90deg);
  }

  .post {
    width: 55px;
    height: 65px;
    background-color: #f3f4f6;
    position: absolute;
    z-index: 11;
    bottom: 5px;
    border-radius: 6px;
    overflow: hidden;
    animation: ${slidePost} 1.8s cubic-bezier(0.23, 1, 0.32, 1) infinite;
  }

  .post-line {
    width: 40px;
    height: 8px;
    background-color: #4b5563;
    position: absolute;
    border-radius: 0 0 2px 2px;
    right: 7.5px;
    top: 8px;
  }

  .screen {
    width: 40px;
    height: 20px;
    background-color: #ffffff;
    position: absolute;
    top: 20px;
    right: 7.5px;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon {
    font-size: 14px;
    font-weight: bold;
    color: #ef4444;
    animation: ${fadeInFwd} 0.3s 0.7s backwards infinite;
  }

  .numbers {
    width: 10px;
    height: 10px;
    background-color: #9ca3af;
    box-shadow: 0 -15px 0 0 #9ca3af, 0 15px 0 0 #9ca3af;
    border-radius: 2px;
    position: absolute;
    transform: rotate(90deg);
    left: 22px;
    top: 45px;
  }

  .numbers-line2 {
    width: 10px;
    height: 10px;
    background-color: #d1d5db;
    box-shadow: 0 -15px 0 0 #d1d5db, 0 15px 0 0 #d1d5db;
    border-radius: 2px;
    position: absolute;
    transform: rotate(90deg);
    left: 22px;
    top: 58px;
  }
`;

interface ErrorNotificationProps {
    title: string;
    message: string;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ title, message }) => {
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
                            <div className="icon">!</div>
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

export default ErrorNotification;
