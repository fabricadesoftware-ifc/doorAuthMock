import express from 'express'
export interface Port {
    port: number;
}

export interface CreateUser {
    name: string;
    email: string;
}

