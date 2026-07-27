import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, TrendingUp, TrendingDown, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useVentureFinancials } from '@/hooks/useVentureFinancials';
import { useVentures } from '@/hooks/useVentures';

const categories = ['Sales', 'Marketing', 'Operations', 'Payroll', 'Technology', 'Office', 'Travel', 'Other'];

export default function EntrepreneurFinancialsPage() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState<string>('');
  const { financials, loading, totalRevenue, totalExpenses, netProfit, addFinancial, deleteFinancial } = useVentureFinancials(selectedVenture || undefined);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = async () => {
    if (!amount || Number(amount) <= 0) return;
    await addFinancial({
      venture_id: selectedVenture || undefined,
      type,
      category,
      amount: Number(amount),
      description,
      transaction_date: date,
    });
    setAmount(''); setCategory(''); setDescription('');
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><DollarSign className="w-8 h-8 text-primary" /> Financial Tracker</h1>
          <p className="text-muted-foreground">Track revenue, expenses, and cash flow for your ventures</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Ventures" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Ventures</SelectItem>
              {ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Transaction</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Amount (ZMW)" value={amount} onChange={e => setAmount(e.target.value)} />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                {ventures.length > 0 && (
                  <Select value={selectedVenture} onValueChange={setSelectedVenture}>
                    <SelectTrigger><SelectValue placeholder="Link to venture" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No venture</SelectItem>
                      {ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={handleAdd} className="w-full">Add Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1"><ArrowUpRight className="w-5 h-5" /> ZMW {totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 flex items-center gap-1"><ArrowDownRight className="w-5 h-5" /> ZMW {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>ZMW {netProfit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading...</p> : financials.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions yet. Add your first one!</p>
          ) : (
            <div className="space-y-2">
              {financials.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {f.type === 'revenue' ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className="text-sm font-medium">{f.description || f.category || f.type}</p>
                      <p className="text-xs text-muted-foreground">{f.transaction_date} {f.category && `• ${f.category}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${f.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                      {f.type === 'revenue' ? '+' : '-'}ZMW {Number(f.amount).toLocaleString()}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => deleteFinancial(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
