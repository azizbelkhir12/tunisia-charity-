import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../services/socket/socket.service';
import { MessageService } from '../services/message/message.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages: any[] = [];
  newMessage = '';

  senderId = '680aa169a707348ab78f8282'; // ADMIN ID
  senderRole = 'admin';

  receiverId = '';
  receiverRole = 'volunteer';
  selectedVolunteerName = '';

  volunteers: any[] = [];
  filteredVolunteers: any[] = [];
  volunteerSearch = '';

  constructor(
    private socketService: SocketService,
    private messageService: MessageService,
    private volunteerService: VolunteerService
  ) {}

  ngOnInit(): void {
    this.socketService.joinRoom(this.senderId);
    this.getVolunteers();

    this.socketService.onReceiveMessage().subscribe((msg: any) => {

      // If chat is open → show message
      if (msg.senderId === this.receiverId) {
        this.messages.push(msg);
      }

      // Always update conversation list
      this.updateConversationList(msg);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.receiverId) return;

    const message = {
      senderId: this.senderId,
      senderRole: this.senderRole,
      receiverId: this.receiverId,
      receiverRole: this.receiverRole,
      text: this.newMessage
    };

    this.messages.push(message);
    this.socketService.sendMessage(message);
    this.messageService.sendMessage(message).subscribe();

    // Update preview instantly
    this.updateConversationList(message, true);

    this.newMessage = '';
  }

  selectConversation(volunteer: any) {
    this.receiverId = volunteer._id;
    this.selectedVolunteerName = volunteer.name;

    volunteer.unread = false;

    this.messages = [];

    this.messageService
      .getConversation(this.senderId, this.receiverId)
      .subscribe((res: any) => {
        this.messages = res;
      });
  }

  updateConversationList(msg: any, isMe = false) {
    const userId = isMe ? msg.receiverId : msg.senderId;

    const index = this.volunteers.findIndex(v => v._id === userId);
    if (index === -1) return;

    const conversation = this.volunteers[index];

    conversation.lastMessage = msg.text;

    if (!isMe && this.receiverId !== userId) {
      conversation.unread = true;
    }

    // Move to top
    this.volunteers.splice(index, 1);
    this.volunteers.unshift(conversation);

    // 🔥 FORCE UI UPDATE
    this.filteredVolunteers = [...this.volunteers];
  }

  getVolunteers() {
    this.volunteerService.getVolunteers().subscribe((data: any[]) => {
      this.volunteers = data.map(v => ({
        ...v,
        unread: false,
        lastMessage: ''
      }));
      this.filteredVolunteers = [...this.volunteers];
    });
  }

  filterVolunteers() {
    const search = this.volunteerSearch.toLowerCase();
    this.filteredVolunteers = this.volunteers.filter(v =>
      v.name.toLowerCase().includes(search)
    );
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
  
}
