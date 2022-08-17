import React, { useState } from 'react'
import styled from 'styled-components'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Tooltip } from '@mui/material'
import { MoreVert, Chat, Logout, Search } from '@mui/icons-material'
import { useCollection } from 'react-firebase-hooks/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { addDoc, collection, query, where } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { Conversation } from '../types'
import { signOut } from 'firebase/auth'
import * as EmailValidator from 'email-validator'
import ConversationSelect from './ConversationSelect'

const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
`

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
`

const StyledSearch = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 2px;
`

const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

const StyledSearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
`

const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`

function Sidebar() {
  const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [loggedInUser] = useAuthState(auth)

  const queryGetConversationsForCurrentUser = query(collection(db, 'conversations'), where('users', 'array-contains', loggedInUser?.email))
  const [conversationsSnapshot] = useCollection(queryGetConversationsForCurrentUser)

  const toggleNewConversationDialog = (isOpen: boolean) => {
    setIsOpenNewConversationDialog(isOpen)
    if (!isOpen) setRecipientEmail('')
  }

  const closeNewConversationDialog = () => {
    toggleNewConversationDialog(false)
  }

  const isInvitingSelf = recipientEmail === loggedInUser?.email

  const isConversationAlreadyExists = (recipientEmail: string) => {
    return conversationsSnapshot?.docs.find((conversation) => (conversation.data() as Conversation).users.includes(recipientEmail))
  }

  const createConversation = async () => {
    if (!recipientEmail) return

    if (EmailValidator.validate(recipientEmail) && !isInvitingSelf && !isConversationAlreadyExists(recipientEmail)) {
      console.log('conversationsSnapshot', conversationsSnapshot?.docs)
      // Add conversation user to db "conversations" collection
      // A conversation is between the currently logged in user and the user invited.

      await addDoc(collection(db, 'conversations'), {
        users: [loggedInUser?.email, recipientEmail],
      })
    }

    closeNewConversationDialog()
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.log('ERROR LOGGING OUT', error)
    }
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <Tooltip title="" placeholder="right">
          <StyledUserAvatar />
        </Tooltip>
        <div>
          <IconButton>
            <Chat />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
          <IconButton onClick={logout}>
            <Logout />
          </IconButton>
        </div>
      </StyledHeader>
      <StyledSearch>
        <Search />
        <StyledSearchInput placeholder="Search in conversations" />
      </StyledSearch>
      <StyledSidebarButton
        onClick={() => {
          toggleNewConversationDialog(true)
        }}
      >
        Start a new conversation
      </StyledSidebarButton>
      {conversationsSnapshot?.docs.map((conversation) => (
        <ConversationSelect key={conversation.id} id={conversation.id} conversationUsers={(conversation.data() as Conversation).users} />
      ))}
      <Dialog open={isOpenNewConversationDialog} onClose={closeNewConversationDialog}>
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>Please enter a Google email address for the user you wish to chat with</DialogContentText>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={recipientEmail}
            onChange={(event) => {
              setRecipientEmail(event.target.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewConversationDialog}>Cancel</Button>
          <Button disabled={!recipientEmail} onClick={createConversation}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  )
}

export default Sidebar
