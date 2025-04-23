import React, { useState } from "react";

const MessagesPage = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      user: {
        name: "Alex Johnson",
        avatar: "AJ",
        status: "online",
        title: "Web Developer",
      },
      lastMessage: {
        text: "I'll start working on the design implementation tomorrow.",
        time: "10:45 AM",
        isUnread: true,
      },
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Hi there! I've reviewed the project requirements and I'm ready to start working on your website redesign.",
          time: "Yesterday, 2:30 PM",
        },
        {
          id: 2,
          sender: "me",
          text: "Great to hear that! When do you think you can have the first design mockups ready?",
          time: "Yesterday, 3:15 PM",
        },
        {
          id: 3,
          sender: "them",
          text: "I should be able to have the initial mockups ready by the end of this week. Would that work for you?",
          time: "Yesterday, 4:20 PM",
        },
        {
          id: 4,
          sender: "me",
          text: "That sounds perfect. Looking forward to seeing them!",
          time: "Yesterday, 4:45 PM",
        },
        {
          id: 5,
          sender: "them",
          text: "I'll start working on the design implementation tomorrow.",
          time: "Today, 10:45 AM",
        },
      ],
    },
    {
      id: 2,
      user: {
        name: "Sarah Williams",
        avatar: "SW",
        status: "offline",
        title: "Content Marketer",
      },
      lastMessage: {
        text: "I've just sent you the first draft of the marketing plan.",
        time: "Yesterday",
        isUnread: false,
      },
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Hello, I'm starting to work on your marketing campaign project today.",
          time: "Monday, 9:45 AM",
        },
        {
          id: 2,
          sender: "me",
          text: "Hi Sarah! That's great news. Do you need any additional information from me?",
          time: "Monday, 10:30 AM",
        },
        {
          id: 3,
          sender: "them",
          text: "I think I have everything I need for now. I'll put together a draft marketing plan for your review.",
          time: "Monday, 11:15 AM",
        },
        {
          id: 4,
          sender: "them",
          text: "I've just sent you the first draft of the marketing plan.",
          time: "Yesterday, 3:00 PM",
        },
      ],
    },
    {
      id: 3,
      user: {
        name: "Michael Chen",
        avatar: "MC",
        status: "online",
        title: "Mobile Developer",
      },
      lastMessage: {
        text: "Let me know when you're available to discuss the app requirements in more detail.",
        time: "Monday",
        isUnread: true,
      },
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Thank you for selecting me for your mobile app project.",
          time: "Monday, 1:15 PM",
        },
        {
          id: 2,
          sender: "them",
          text: "I've reviewed the initial requirements and have some questions about the user authentication flow.",
          time: "Monday, 1:17 PM",
        },
        {
          id: 3,
          sender: "them",
          text: "Let me know when you're available to discuss the app requirements in more detail.",
          time: "Monday, 1:20 PM",
        },
      ],
    },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    // In a real app, this would send the message to an API
    setNewMessage("");
    // Add message to conversation
    console.log("Message sent:", newMessage);
  };

  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden flex h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-73px)]">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex ${
                  activeConversation?.id === conversation.id ? "bg-background-light" : ""
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
                    {conversation.user.avatar}
                  </div>
                  {conversation.user.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{conversation.user.name}</h3>
                    <span className="text-xs text-gray-500">{conversation.lastMessage.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.text}</p>
                  <p className="text-xs text-gray-500">{conversation.user.title}</p>
                </div>
                {conversation.lastMessage.isUnread && (
                  <div className="ml-2 w-3 h-3 bg-primary rounded-full self-center"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Area */}
        <div className="hidden md:flex flex-col w-2/3">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
                    {activeConversation.user.avatar}
                  </div>
                  {activeConversation.user.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{activeConversation.user.name}</h3>
                  <p className="text-sm text-gray-500">{activeConversation.user.title}</p>
                </div>
                <div className="ml-auto flex space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender !== "me" && (
                        <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-white font-medium mr-2">
                          {activeConversation.user.avatar}
                        </div>
                      )}
                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === "me" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">{message.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex">
                  <div className="flex items-center mr-2">
                    <button type="button" className="p-2 text-gray-500 hover:text-gray-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="ml-2 p-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700">Your Messages</h3>
                <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile view - No conversation selected */}
        {!activeConversation && (
          <div className="md:hidden flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700">Your Messages</h3>
              <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
