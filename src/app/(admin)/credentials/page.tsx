'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useAllCredentials,
  useAdminCreateCredential,
  useAdminUpdateCredential,
  useAdminDeleteCredential,
  CredentialWithClient
} from '@/lib/hooks/use-admin-credentials'
import { useClients } from '@/lib/hooks'
import { CredentialType } from '@/types/database'
import {
  Plus,
  Key,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Database,
  Terminal,
  KeyRound,
  Search,
  Building2,
  Loader2,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const credentialTypeIcons: Record<CredentialType, React.ReactNode> = {
  login: <Lock className="h-4 w-4" />,
  api_key: <Key className="h-4 w-4" />,
  oauth: <KeyRound className="h-4 w-4" />,
  ssh: <Terminal className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  other: <Globe className="h-4 w-4" />
}

const credentialTypeLabels: Record<CredentialType, string> = {
  login: 'Login',
  api_key: 'API Key',
  oauth: 'OAuth',
  ssh: 'SSH',
  database: 'Database',
  other: 'Other'
}

const defaultFormData = {
  client_id: '',
  name: '',
  credential_type: 'login' as CredentialType,
  username: '',
  password: '',
  api_key: '',
  url: '',
  notes: ''
}

export default function AdminCredentialsPage() {
  const { data: credentials, isLoading: credentialsLoading } = useAllCredentials()
  const { data: clients } = useClients()
  const createCredential = useAdminCreateCredential()
  const updateCredential = useAdminUpdateCredential()
  const deleteCredential = useAdminDeleteCredential()

  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<CredentialWithClient | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  // Filter and group credentials
  const filteredCredentials = useMemo(() => {
    if (!credentials) return []
    
    return credentials.filter(cred => {
      const matchesSearch = search === '' ||
        cred.name.toLowerCase().includes(search.toLowerCase()) ||
        cred.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        cred.url?.toLowerCase().includes(search.toLowerCase()) ||
        cred.username?.toLowerCase().includes(search.toLowerCase())
      
      const matchesClient = filterClient === 'all' || cred.client_id === filterClient
      
      return matchesSearch && matchesClient
    })
  }, [credentials, search, filterClient])

  // Group by client
  const groupedCredentials = useMemo(() => {
    const groups: Record<string, { client: { id: string; name: string; company: string | null }; credentials: CredentialWithClient[] }> = {}
    
    for (const cred of filteredCredentials) {
      const clientId = cred.client_id
      if (!groups[clientId]) {
        groups[clientId] = {
          client: cred.client,
          credentials: []
        }
      }
      groups[clientId].credentials.push(cred)
    }
    
    return Object.values(groups).sort((a, b) => a.client.name.localeCompare(b.client.name))
  }, [filteredCredentials])

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisiblePasswords(newVisible)
  }

  const openCreateDialog = () => {
    setEditingCredential(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (credential: CredentialWithClient) => {
    setEditingCredential(credential)
    setFormData({
      client_id: credential.client_id,
      name: credential.name,
      credential_type: credential.credential_type,
      username: credential.username || '',
      password: credential.password || '',
      api_key: credential.api_key || '',
      url: credential.url || '',
      notes: credential.notes || ''
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a name for this credential')
      return
    }

    if (!editingCredential && !formData.client_id) {
      toast.error('Please select a client')
      return
    }

    try {
      if (editingCredential) {
        const { client_id, ...updates } = formData
        await updateCredential.mutateAsync({
          id: editingCredential.id,
          ...updates
        })
        toast.success('Credential updated')
      } else {
        await createCredential.mutateAsync(formData)
        toast.success('Credential added')
      }
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credential')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return

    try {
      await deleteCredential.mutateAsync(deleteConfirmId)
      toast.success('Credential deleted')
      setDeleteConfirmId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete credential')
    }
  }

  const isPending = createCredential.isPending || updateCredential.isPending

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Credentials</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage all client credentials in one place
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search credentials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
        </div>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            <Filter className="h-4 w-4 mr-2 text-zinc-400" />
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Credentials List */}
      {credentialsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : !filteredCredentials.length ? (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <Key className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white text-center">
              {search || filterClient !== 'all' ? 'No credentials found' : 'No credentials yet'}
            </h3>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-center text-sm max-w-md">
              {search || filterClient !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Add credentials for your clients to manage API keys, logins, and more.'}
            </p>
            {!search && filterClient === 'all' && (
              <Button
                onClick={openCreateDialog}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Credential
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedCredentials.map((group) => (
            <div key={group.client.id}>
              {/* Client Header */}
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {group.client.name}
                  {group.client.company && (
                    <span className="text-zinc-400 font-normal ml-1">({group.client.company})</span>
                  )}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {group.credentials.length}
                </Badge>
              </div>

              {/* Credentials */}
              <div className="space-y-2">
                {group.credentials.map((credential) => (
                  <Card key={credential.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-500">
                            {credentialTypeIcons[credential.credential_type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-zinc-900 dark:text-white truncate">
                                {credential.name}
                              </h3>
                              <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs">
                                {credentialTypeLabels[credential.credential_type]}
                              </Badge>
                            </div>

                            {/* Credential details */}
                            <div className="space-y-1 text-sm">
                              {credential.url && (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                  <span className="text-zinc-400 dark:text-zinc-500">URL:</span> {credential.url}
                                </p>
                              )}
                              {credential.username && (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                  <span className="text-zinc-400 dark:text-zinc-500">Username:</span> {credential.username}
                                </p>
                              )}
                              {credential.password && (
                                <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                  <span className="text-zinc-400 dark:text-zinc-500">Password:</span>
                                  <span className="font-mono">
                                    {visiblePasswords.has(credential.id) ? credential.password : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(credential.id)}
                                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                  >
                                    {visiblePasswords.has(credential.id) ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </p>
                              )}
                              {credential.api_key && (
                                <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                  <span className="text-zinc-400 dark:text-zinc-500">API Key:</span>
                                  <span className="font-mono">
                                    {visiblePasswords.has(`api-${credential.id}`)
                                      ? credential.api_key
                                      : credential.api_key.slice(0, 8) + '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(`api-${credential.id}`)}
                                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                  >
                                    {visiblePasswords.has(`api-${credential.id}`) ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </p>
                              )}
                              {credential.notes && (
                                <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-2">
                                  {credential.notes}
                                </p>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                              Added {format(new Date(credential.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(credential)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(credential.id)}
                            className="text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCredential ? 'Edit Credential' : 'Add Credential'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingCredential && (
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                >
                  <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production API Key, Admin Login"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(v) => setFormData({ ...formData, credential_type: v as CredentialType })}
              >
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectItem value="login">Login (Username/Password)</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="ssh">SSH</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>URL (optional)</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>

            {(formData.credential_type === 'login' || formData.credential_type === 'database' || formData.credential_type === 'ssh') && (
              <>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin@example.com"
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </>
            )}

            {(formData.credential_type === 'api_key' || formData.credential_type === 'oauth') && (
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <Input
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-mono"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingCredential ? 'Update' : 'Add'} Credential</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 dark:text-white">Delete Credential</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this credential? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
