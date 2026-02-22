'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  Mail, 
  UserPlus, 
  Copy, 
  Calendar, 
  Clock, 
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invite {
    id: string;
    code: string;
    expiresAt: string;
    createdAt: string;
}

export default function MembersPage() {
  const { organization } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchMembers();
      fetchInvites();
    }
  }, [organization]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/org/${organization?.slug}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch members', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
      try {
          const res = await fetch(`/api/org/${organization?.slug}/invites`);
          if (res.ok) {
              const data = await res.json();
              setInvites(data);
          }
      } catch (error) {
          console.error("Failed to fetch invites", error);
      }
  }

  const handleGenerateInvite = async () => {
      setInviteLoading(true);
      try {
          const res = await fetch(`/api/org/${organization?.slug}/invites`, {
              method: 'POST'
          });
          if (res.ok) {
              const newInvite = await res.json();
              setInvites([newInvite, ...invites]);
              toast.success("New invite code generated!");
          } else {
              toast.error("Failed to generate invite.");
          }
      } catch (error) {
          console.error("Error generating invite", error);
          toast.error("Error generating invite.");
      } finally {
          setInviteLoading(false);
      }
  }
    
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
  }

  if (loading) {
     return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 opacity-80" />
            Library Members
          </h1>
          <p className="text-gray-600 text-lg font-light">
            Manage your community of scholars and readers.
          </p>
        </div>
        <button 
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-primary-dark font-semibold rounded-lg shadow-md hover:bg-secondary-dark hover:text-white transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-5 h-5" />
          {inviteLoading ? 'Generating...' : 'Invite New Member'}
        </button>
      </div>

      {/* Invites Section */}
      {invites.length > 0 && (
          <div className="mb-12 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100">
                <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-secondary-dark" />
                  Active Invitations
                </h2>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                              <th className="px-8 py-4 font-medium">Invite Code</th>
                              <th className="px-8 py-4 font-medium">Link</th>
                              <th className="px-8 py-4 font-medium">Created</th>
                              <th className="px-8 py-4 font-medium">Expires</th>
                              <th className="px-8 py-4 font-medium text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {invites.map((invite) => {
                              const inviteLink = `${window.location.origin}/register?invite=${invite.code}`;
                              return (
                                  <tr key={invite.id} className="group hover:bg-blue-50/30 transition-colors">
                                      <td className="px-8 py-4">
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-primary-dark font-medium border border-gray-200">
                                          {invite.code}
                                        </span>
                                      </td>
                                      <td className="px-8 py-4 text-gray-600 text-sm max-w-xs truncate font-mono">
                                        {inviteLink}
                                      </td>
                                      <td className="px-8 py-4 text-gray-500 text-sm flex items-center gap-1">
                                          <Calendar className="w-4 h-4 opacity-70" />
                                          {new Date(invite.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="px-8 py-4 text-gray-500 text-sm">
                                         <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4 opacity-70" />
                                          {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'Never'}
                                         </div>
                                      </td>
                                      <td className="px-8 py-4 text-right">
                                          <button 
                                              onClick={() => copyToClipboard(inviteLink)}
                                              className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1 ml-auto transition-colors px-3 py-1 rounded hover:bg-primary/5"
                                          >
                                              <Copy className="w-4 h-4" />
                                              Copy Link
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-dark" />
              Directory
            </h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </span>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Name</th>
              <th className="px-8 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Email</th>
              <th className="px-8 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Role</th>
              <th className="px-8 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Joined Date</th>
              <th className="px-8 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-lg mr-4 border border-primary/20">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{member.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-gray-600 font-light">{member.email}</td>
                <td className="px-8 py-5 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm
                    ${member.role === 'admin' 
                      ? 'bg-primary/5 text-primary border-primary/20' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {member.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-gray-500 text-sm">
                  {new Date(member.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-right">
                  <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <Users className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-1">No members yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                              Your library is empty! Start by inviting students, faculty, or colleagues to join your organization.
                            </p>
                            <button 
                                onClick={handleGenerateInvite}
                                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-sm"
                            >
                                Invite First Member
                            </button>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
